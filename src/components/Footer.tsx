import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="py-5 sm:py-6 border-t border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link href="/" className="flex items-center">
          <Image
            src="/brand/freestocks-logo.png"
            alt="Freestocks"
            width={120}
            height={28}
            className="h-7 w-auto"
          />
        </Link>
        <div className="flex items-center gap-4 text-xs text-muted">
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
        </div>
        <p className="text-xs text-muted">© {new Date().getFullYear()} Freestocks</p>
      </div>
    </footer>
  );
}
