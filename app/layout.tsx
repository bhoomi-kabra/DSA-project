import type { Metadata } from "next";
import "@/styles/globals.css";
import "@/styles/App.css";
import "@/styles/AuthPage.css";
import "@/styles/Roadmap.css";
import "@xyflow/react/dist/style.css";

export const metadata: Metadata = {
  title: "PathPilot — Personalised Learning Path Planner",
  description: "Build a learning path that matches your goals, one prerequisite at a time.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var saved = localStorage.getItem('pathpilot-theme');
                var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                var theme = (saved === 'light' || saved === 'dark') ? saved : (prefersDark ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', theme);
                document.documentElement.dataset.theme = theme;
              } catch (e) {}
            })();`,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

