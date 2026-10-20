import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PathPilot | Backend API & Database Gateway",
  description: "Personalized Learning Path Planner - Graph Backend Service",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: "#ffffff", color: "#111827", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
