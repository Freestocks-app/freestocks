"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DollarSign, Gift, Wallet, Ticket, TrendingUp, LogOut, User, Zap, Flame } from "lucide-react";
import { signOut } from "@/lib/auth-client";

const navItems = [
  { href: "/earn", label: "Earn", icon: DollarSign },
  { href: "/offers", label: "My Offers", icon: Gift },
  { href: "/cashout", label: "Cashout", icon: Wallet },
  { href: "/lottery", label: "Lottery", icon: Ticket },
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
    <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-14 items-center px-4 bg-[#0d1117] border-b border-border">
      {/* Logo - Left */}
      <Link href="/" className="flex items-center gap-2 mr-8">
        <div className="w-7 h-7 rounded-lg bg-cta flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-cta-ink" />
        </div>
        <span className="font-bold text-base">Freestocks</span>
      </Link>

      {/* Center Nav Tabs */}
      <nav className="flex-1 flex items-center justify-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                isActive
                  ? "bg-elevated text-foreground"
                  : "text-muted hover:text-foreground hover:bg-elevated/50"
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                isActive ? "bg-cta/20" : "bg-elevated"
              }`}>
                <Icon className={`w-3 h-3 ${isActive ? "text-cta" : "text-muted"}`} />
              </div>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right - Balance + User */}
      <div className="flex items-center gap-2">
        {/* Streak placeholder */}
        <div className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center">
          <Flame className="w-4 h-4 text-muted" />
        </div>
        
        {/* Balance pill */}
        <div className="flex items-center gap-1.5 bg-cta/10 border border-cta/30 rounded-full px-3 py-1.5">
          <span className="text-cta font-bold text-sm tabular-nums">
            ${formatBalance(balanceCents)}
          </span>
        </div>

        {/* User avatar / logout */}
        <button
          onClick={handleSignOut}
          className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center hover:bg-elevated/80 transition-colors"
          title={userName ? `Sign out (${userName})` : "Sign out"}
        >
          {userName ? (
            <span className="text-xs font-medium">{userName.charAt(0).toUpperCase()}</span>
          ) : (
            <User className="w-4 h-4 text-muted" />
          )}
        </button>
      </div>
    </header>
  );
}

export function MobileNav({ balanceCents }: NavigationProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Top header - logo + balance */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-3 bg-[#0d1117] border-b border-border">
        <Link href="/" className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md bg-cta flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-cta-ink" />
          </div>
          <span className="font-bold text-sm">Freestocks</span>
        </Link>

        <div className="flex items-center gap-1.5 bg-cta/10 border border-cta/30 rounded-full px-2.5 py-1">
          <span className="text-cta font-bold text-sm tabular-nums">
            ${formatBalance(balanceCents)}
          </span>
        </div>
      </header>

      {/* Bottom nav tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d1117] border-t border-border safe-bottom">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 min-w-[60px] transition-colors ${
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
