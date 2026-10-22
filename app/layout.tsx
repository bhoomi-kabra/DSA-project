import type { Metadata } from "next";
import "@/styles/globals.css";
import "@/styles/App.css";
import "@/styles/AuthPage.css";
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
      <body>
        {children}
      </body>
    </html>
  );
}

