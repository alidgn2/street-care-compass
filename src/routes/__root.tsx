import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import "../lib/fonts";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Sayfa bulunamadı</h2>
        <p className="mt-2 text-sm text-muted-foreground">Aradığın sayfa mevcut değil.</p>
        <a href="/" className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Ana sayfa</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Bir şeyler ters gitti</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sayfa yüklenemedi. Tekrar deneyebilirsin.</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Tekrar dene</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "PatiHarita — Sokak Hayvanları Topluluğu" },
      { name: "description", content: "Türkiye genelinde sokak hayvanlarına mama, su ve yardım takibi yapan topluluk uygulaması." },
      { name: "theme-color", content: "#FF6B35" },
      { property: "og:title", content: "PatiHarita — Sokak Hayvanları Topluluğu" },
      { property: "og:description", content: "Türkiye genelinde sokak hayvanlarına mama, su ve yardım takibi yapan topluluk uygulaması." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "PatiHarita — Sokak Hayvanları Topluluğu" },
      { name: "twitter:description", content: "Türkiye genelinde sokak hayvanlarına mama, su ve yardım takibi yapan topluluk uygulaması." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c16585a2-dc06-4c22-86dc-822112707f94/id-preview-ef8c92a3--a2462350-187b-415f-9275-1043a5c68592.lovable.app-1781826391397.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c16585a2-dc06-4c22-86dc-822112707f94/id-preview-ef8c92a3--a2462350-187b-415f-9275-1043a5c68592.lovable.app-1781826391397.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
