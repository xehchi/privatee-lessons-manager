import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { AppHeader } from "@/components/AppHeader";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">העמוד לא נמצא</h2>
        <p className="mt-2 text-sm text-muted-foreground">העמוד שחיפשת לא קיים.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "יומן שיעורים – ניהול לוח זמנים לתלמידות" },
      { name: "description", content: "יומן ניהול שיעורים לתלמידות. שיבוץ לפי זמני עבודה, תצוגה שבועית ויומית, ייצוא לאקסל. עובד אופליין." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "יומן שיעורים – ניהול לוח זמנים לתלמידות" },
      { property: "og:description", content: "יומן ניהול שיעורים לתלמידות. שיבוץ לפי זמני עבודה, תצוגה שבועית ויומית, ייצוא לאקסל. עובד אופליין." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "יומן שיעורים – ניהול לוח זמנים לתלמידות" },
      { name: "twitter:description", content: "יומן ניהול שיעורים לתלמידות. שיבוץ לפי זמני עבודה, תצוגה שבועית ויומית, ייצוא לאקסל. עובד אופליין." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/926fb97b-79d2-45ba-823d-640c4ffb6fcb/id-preview-681ed1cd--ec827890-60d7-4d68-9bc0-40be657ef6a2.lovable.app-1777926582759.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/926fb97b-79d2-45ba-823d-640c4ffb6fcb/id-preview-681ed1cd--ec827890-60d7-4d68-9bc0-40be657ef6a2.lovable.app-1777926582759.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
      <Toaster richColors position="top-center" dir="rtl" />
    </div>
  );
}
