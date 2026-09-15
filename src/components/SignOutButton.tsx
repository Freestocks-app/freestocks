"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  async function handleSignOut() {
    await signOut();
    window.location.href = "/";
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-red-500/20 text-red-400 font-medium text-sm hover:border-red-500/40 hover:bg-red-500/5 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </button>
  );
}
