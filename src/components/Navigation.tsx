"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DollarSign, Gift, Wallet, Ticket, User, Flame } from "lucide-react";

const navItems = [
  { href: "/earn", label: "Earn", icon: DollarSign },
  { href: "/offers", label: "My Offers", icon: Gift },
  { href: "/cashout", label: "Cashout", icon: Wallet },
  { href: "/lottery", label: "Lottery", icon: Ticket },
];

interface NavigationProps {
  balanceCents: number;
  userName?: string;
  streakCount: number;
}

function formatBalance(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function DesktopNav({ balanceCents, userName, streakCount }: NavigationProps) {
  const pathname = usePathname();

  return (
    <header className="hidden md:grid fixed top-0 left-0 right-0 z-50 h-14 grid-cols-[auto_1fr_auto] items-center px-4 bg-[#0d1117] border-b border-border">
      {/* Logo - Left */}
      <Link href="/" className="flex items-center mr-8">
        <img
          src="/brand/freestocks-logo.png"
          alt="Freestocks"
          className="h-7 md:h-8 w-auto"
        />
      </Link>

      {/* Center Nav Tabs */}
      <nav className="flex items-center justify-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-colors ${
                isActive
                  ? "bg-elevated text-foreground"
                  : "text-muted hover:text-foreground hover:bg-elevated/50"
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isActive ? "bg-cta/20" : "bg-elevated"
              }`}>
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cta" : "text-muted"}`} />
              </div>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right - Streak + Balance + User */}
      <div className="flex items-center gap-2 justify-self-end">
        {/* Streak pill */}
        <div className="flex items-center gap-1.5 bg-elevated border border-border rounded-full px-3 py-1.5">
          <Flame className="w-4 h-4 text-cta" />
          <span className="font-bold text-sm tabular-nums">{streakCount}</span>
        </div>

        {/* Balance pill */}
        <Link
          href="/cashout"
          className="flex items-center gap-1.5 bg-cta/10 border border-cta/30 rounded-full px-3 py-1.5 hover:bg-cta/20 transition-colors"
        >
          <span className="text-cta font-bold text-sm tabular-nums">
            ${formatBalance(balanceCents)}
          </span>
        </Link>

        {/* User avatar -> profile */}
        <Link
          href="/profile"
          className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center hover:bg-elevated/80 transition-colors"
          title={userName ? `View profile (${userName})` : "View profile"}
        >
          {userName ? (
            <span className="text-xs font-medium">{userName.charAt(0).toUpperCase()}</span>
          ) : (
            <User className="w-4 h-4 text-muted" />
          )}
        </Link>
      </div>
    </header>
  );
}

export function MobileNav({ balanceCents, streakCount }: NavigationProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Top header - logo + streak + balance */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-3 bg-[#0d1117] border-b border-border">
        <Link href="/" className="flex items-center">
          <img
            src="/brand/freestocks-logo.png"
            alt="Freestocks"
            className="h-6 sm:h-7 w-auto"
          />
        </Link>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-elevated border border-border rounded-full px-2 py-1">
            <Flame className="w-3.5 h-3.5 text-cta" />
            <span className="font-bold text-xs tabular-nums">{streakCount}</span>
          </div>

          <Link
            href="/cashout"
            className="flex items-center gap-1.5 bg-cta/10 border border-cta/30 rounded-full px-2.5 py-1 hover:bg-cta/20 transition-colors"
          >
            <span className="text-cta font-bold text-sm tabular-nums">
              ${formatBalance(balanceCents)}
            </span>
          </Link>
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

export function Navigation({ balanceCents, userName, streakCount }: NavigationProps) {
  return (
    <>
      <DesktopNav balanceCents={balanceCents} userName={userName} streakCount={streakCount} />
      <MobileNav balanceCents={balanceCents} userName={userName} streakCount={streakCount} />
    </>
  );
}
