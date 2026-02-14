import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  BarChart3,
  PlusCircle,
  Home,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import "./globals.css";

export const metadata: Metadata = {
  title: "Info Diet Tracker",
  description: "Track your information consumption",
};

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {children}
    </Link>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <div className="flex min-h-screen">
          <aside className="hidden w-56 shrink-0 border-r md:block">
            <div className="flex h-14 items-center px-4">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                Info Diet
              </Link>
            </div>
            <Separator />
            <nav className="flex flex-col gap-1 p-2">
              <NavLink href="/">
                <Home className="h-4 w-4" />
                Dashboard
              </NavLink>
              <NavLink href="/items">
                <BookOpen className="h-4 w-4" />
                Browse
              </NavLink>
              <NavLink href="/items/new">
                <PlusCircle className="h-4 w-4" />
                Add Item
              </NavLink>
              <NavLink href="/stats">
                <BarChart3 className="h-4 w-4" />
                Stats
              </NavLink>
            </nav>
          </aside>
          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-5xl p-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
