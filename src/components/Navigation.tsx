"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DollarSign, Gift, Lock, HelpCircle, TrendingUp, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";

const navItems = [
  { href: "/earn", label: "Earn", icon: DollarSign },
  { href: "/offers", label: "My Offers", icon: Gift },
  { href: "/unlock", label: "Unlock", icon: Lock },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
];

interface NavigationProps {
  balanceCents: number;
  userName?: string;
}

function formatBalance(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function DesktopNav({ balanceCents, userName }: NavigationProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-14 items-center justify-between px-6 bg-bg/95 backdrop-blur-md border-b border-border">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-cta flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-cta-ink" />
        </div>
        <span className="font-bold">Freestocks</span>
      </Link>

      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-md font-medium text-sm transition-colors ${
                isActive
                  ? "bg-elevated text-foreground"
                  : "text-muted hover:text-foreground hover:bg-elevated/50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-cta/10 border border-cta/20 rounded-full px-3 py-1">
          <DollarSign className="w-3.5 h-3.5 text-cta" />
          <span className="text-cta font-bold text-sm tabular-nums">
            {formatBalance(balanceCents)}
          </span>
        </div>
        {userName && (
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-elevated/50 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}

export function MobileNav({ balanceCents }: NavigationProps) {
  const pathname = usePathname();

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-3 bg-bg/95 backdrop-blur-md border-b border-border">
        <Link href="/" className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md bg-cta flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-cta-ink" />
          </div>
          <span className="font-bold text-sm">Freestocks</span>
        </Link>

        <div className="flex items-center gap-1 bg-cta/10 border border-cta/20 rounded-full px-2 py-0.5">
          <DollarSign className="w-3 h-3 text-cta" />
          <span className="text-cta font-bold text-xs tabular-nums">
            {formatBalance(balanceCents)}
          </span>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg/95 backdrop-blur-md border-t border-border safe-bottom">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-4 transition-colors ${
                  isActive ? "text-cta" : "text-muted"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function Navigation({ balanceCents, userName }: NavigationProps) {
  return (
    <>
      <DesktopNav balanceCents={balanceCents} userName={userName} />
      <MobileNav balanceCents={balanceCents} userName={userName} />
    </>
  );
}
