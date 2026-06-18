import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send } from "lucide-react";
import { timeAgo } from "@/lib/pati-utils";

export const Route = createFileRoute("/_authenticated/sohbet/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Sohbet — PatiHarita` }, { name: "description", content: "Sohbet detayı" }],
  }),
  component: ChatDetail,
});

interface Message { id: string; sender_id: string; content: string; created_at: string }

function ChatDetail() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [other, setOther] = useState<{ id: string; full_name: string | null; username: string | null } | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: conv } = await supabase.from("conversations").select("user1_id, user2_id").eq("id", id).maybeSingle();
      if (!conv || !mounted) return;
      const otherId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
      const { data: prof } = await supabase.from("profiles").select("id, full_name, username").eq("id", otherId).maybeSingle();
      if (mounted) setOther(prof ?? null);
      const { data: msgs } = await supabase.from("messages").select("id, sender_id, content, created_at").eq("conversation_id", id).order("created_at", { ascending: true });
      if (mounted) setMessages(msgs ?? []);
    })();
    const channel = supabase.channel(`chat-${id}`).on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
      (payload) => { setMessages((prev) => [...prev, payload.new as Message]); },
    ).subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [id, user.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    setText("");
    const { error } = await supabase.from("messages").insert({ conversation_id: id, sender_id: user.id, content });
    if (error) { setText(content); }
    setSending(false);
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <Link to="/app/chat" className="rounded-full p-1.5 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-bold text-secondary">
          {other?.full_name?.[0] ?? other?.username?.[0] ?? "?"}
        </div>
        <div>
          <p className="font-semibold leading-tight">{other?.full_name ?? other?.username ?? "Kullanıcı"}</p>
          {other?.username && <p className="text-xs text-muted-foreground">@{other.username}</p>}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">İlk mesajı sen at 👋</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${mine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border rounded-bl-md"}`}>
                <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{timeAgo(m.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-border bg-card p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Mesaj yaz..."
          className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <button type="submit" disabled={!text.trim() || sending}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-warm)] transition hover:bg-primary/90 disabled:opacity-50">
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
