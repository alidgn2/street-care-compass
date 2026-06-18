import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeader } from "@/components/AppShell";
import { timeAgo } from "@/lib/pati-utils";
import { MessageCircle, UserPlus, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Sohbet — PatiHarita" },
      { name: "description", content: "Diğer gönüllülerle sohbet et." },
    ],
  }),
  component: ChatList,
});

interface Conv {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  other: { id: string; full_name: string | null; username: string | null; avatar_url: string | null } | null;
  lastMsg: string | null;
}

function ChatList() {
  const { user } = Route.useRouteContext();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [showNew, setShowNew] = useState(false);

  async function load() {
    const { data: rows } = await supabase
      .from("conversations")
      .select("id, user1_id, user2_id, last_message_at")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });
    const list = rows ?? [];
    const otherIds = list.map((c) => (c.user1_id === user.id ? c.user2_id : c.user1_id));
    const { data: profiles } = otherIds.length
      ? await supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", otherIds)
      : { data: [] as { id: string; full_name: string | null; username: string | null; avatar_url: string | null }[] };
    const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const enriched: Conv[] = await Promise.all(list.map(async (c) => {
      const otherId = c.user1_id === user.id ? c.user2_id : c.user1_id;
      const { data: last } = await supabase.from("messages").select("content").eq("conversation_id", c.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      return { ...c, other: profMap.get(otherId) ?? null, lastMsg: last?.content ?? null };
    }));
    setConvs(enriched);
  }

  useEffect(() => {
    load();
    const channel = supabase.channel(`conv-list-${user.id}`).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "conversations" },
      () => load(),
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  return (
    <AppShell>
      <PageHeader title="Sohbetler" subtitle={`${convs.length} sohbet`}
        action={
          <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90">
            <UserPlus className="h-4 w-4" /> Yeni
          </button>
        } />
      <div className="mx-auto max-w-2xl divide-y divide-border">
        {convs.length === 0 && (
          <div className="m-4 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Henüz sohbetin yok. Bir kullanıcı bul ve yazışmaya başla.</p>
          </div>
        )}
        {convs.map((c) => (
          <Link key={c.id} to="/app/chat/$id" params={{ id: c.id }} className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-secondary font-bold">
              {c.other?.full_name?.[0] ?? c.other?.username?.[0] ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold">{c.other?.full_name ?? c.other?.username ?? "Kullanıcı"}</p>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(c.last_message_at)}</span>
              </div>
              <p className="truncate text-sm text-muted-foreground">{c.lastMsg ?? "—"}</p>
            </div>
          </Link>
        ))}
      </div>

      {showNew && <NewChatDialog onClose={() => setShowNew(false)} currentUserId={user.id} onCreated={load} />}
    </AppShell>
  );
}

function NewChatDialog({ onClose, currentUserId, onCreated }: { onClose: () => void; currentUserId: string; onCreated: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ id: string; full_name: string | null; username: string | null }[]>([]);

  useEffect(() => {
    if (q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from("profiles")
        .select("id, full_name, username")
        .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
        .neq("id", currentUserId)
        .limit(10);
      setResults(data ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [q, currentUserId]);

  async function start(otherId: string) {
    const [u1, u2] = currentUserId < otherId ? [currentUserId, otherId] : [otherId, currentUserId];
    const { data: existing } = await supabase.from("conversations").select("id").eq("user1_id", u1).eq("user2_id", u2).maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data: created, error } = await supabase.from("conversations").insert({ user1_id: u1, user2_id: u2 }).select("id").single();
      if (error) { toast.error(error.message); return; }
      convId = created.id;
    }
    onCreated();
    onClose();
    window.location.href = `/app/chat/${convId}`;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-card p-6 sm:rounded-3xl">
        <h2 className="text-xl font-bold">Kullanıcı ara</h2>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="İsim veya kullanıcı adı..." className="w-full bg-transparent text-sm outline-none" />
        </div>
        <div className="mt-3 space-y-1">
          {results.map((u) => (
            <button key={u.id} onClick={() => start(u.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-secondary">{u.full_name?.[0] ?? u.username?.[0] ?? "?"}</div>
              <div>
                <p className="font-semibold">{u.full_name ?? u.username}</p>
                {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
              </div>
            </button>
          ))}
          {q.length >= 2 && results.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Sonuç yok.</p>}
        </div>
      </div>
    </div>
  );
}
