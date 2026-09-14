"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp, signIn } from "@/lib/auth-client";
import { TrendingUp, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
    </svg>
  );
}

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const name = email.split("@")[0] || "User";
      const result = await signUp.email({
        email,
        password,
        name,
        callbackURL: "/earn",
      });

      if (result.error) {
        setError(result.error.message || "Could not create account");
        setLoading(false);
        return;
      }

      router.push("/earn");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleSocialSignUp(provider: "google" | "apple" | "facebook") {
    setError(null);
    setSocialLoading(provider);
    
    try {
      const result = await signIn.social({
        provider,
        callbackURL: `${window.location.origin}/earn`,
      });
      
      if (result?.error) {
        setError(result.error.message || `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign up failed.`);
        setSocialLoading(null);
      }
    } catch {
      setError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} sign up failed. Please try again.`);
      setSocialLoading(null);
    }
  }

  const isDisabled = loading || !!socialLoading;

  return (
    <div className="min-h-screen bg-bg flex flex-col overflow-x-hidden">
      {/* Header - Mobile optimized */}
      <header className="h-11 sm:h-12 flex items-center justify-center border-b border-border bg-elevated/50 px-4">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-cta flex items-center justify-center">
            <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cta-ink" />
          </div>
          <span className="font-bold text-sm">Freestocks</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-6 sm:py-8">
        <div className="w-full max-w-[380px]">
          <div className="card p-4 sm:p-6 border-border/50 bg-elevated/80 backdrop-blur-sm">
            <h1 className="text-lg sm:text-xl font-bold text-center mb-5 sm:mb-6">Sign Up</h1>

            {/* Social buttons - FreeCash style */}
            <div className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-5">
              <button
                onClick={() => handleSocialSignUp("apple")}
                disabled={isDisabled}
                className="w-full flex items-center justify-center gap-2.5 sm:gap-3 py-2.5 sm:py-3 px-4 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-[#252525] transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {socialLoading === "apple" ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <>
                    <AppleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    <span className="font-medium text-xs sm:text-sm">Sign Up with Apple</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleSocialSignUp("google")}
                disabled={isDisabled}
                className="w-full flex items-center justify-center gap-2.5 sm:gap-3 py-2.5 sm:py-3 px-4 rounded-lg bg-white border border-white/20 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {socialLoading === "google" ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-gray-800" />
                ) : (
                  <>
                    <GoogleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-medium text-xs sm:text-sm text-gray-800">Sign up with Google</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleSocialSignUp("facebook")}
                disabled={isDisabled}
                className="w-full flex items-center justify-center gap-2.5 sm:gap-3 py-2.5 sm:py-3 px-4 rounded-lg bg-[#1877F2] border border-[#1877F2] hover:bg-[#166fe5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {socialLoading === "facebook" ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <>
                    <FacebookIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    <span className="font-medium text-xs sm:text-sm text-white">Sign Up with Facebook</span>
                  </>
                )}
              </button>
            </div>

            {/* OR divider */}
            <div className="relative my-4 sm:my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] sm:text-xs">
                <span className="bg-elevated px-3 text-muted">OR</span>
              </div>
            </div>

            {/* Email/Password form */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="email" className="block text-[10px] sm:text-xs font-medium text-foreground mb-1 sm:mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Type here..."
                    className="w-full bg-bg border border-border rounded-lg py-2.5 sm:py-3 pl-11 pr-4 text-sm placeholder:text-muted/60 focus:outline-none focus:border-cta/50 focus:ring-1 focus:ring-cta/20 min-h-[44px]"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-[10px] sm:text-xs font-medium text-foreground mb-1 sm:mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Type here..."
                    className="w-full bg-bg border border-border rounded-lg py-2.5 sm:py-3 pl-11 pr-12 text-sm placeholder:text-muted/60 focus:outline-none focus:border-cta/50 focus:ring-1 focus:ring-cta/20 min-h-[44px]"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-1.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-2.5 sm:p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] sm:text-xs flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Legal text */}
              <p className="text-[10px] sm:text-xs text-muted text-center leading-relaxed">
                By signing up you agree to the{" "}
                <Link href="/privacy" className="text-cta hover:underline">Privacy Policy</Link>
                {" "}and{" "}
                <Link href="/terms" className="text-cta hover:underline">Terms of Service</Link>
              </p>

              <button
                type="submit"
                disabled={isDisabled}
                className="w-full py-2.5 sm:py-3 rounded-lg bg-cta text-cta-ink font-semibold text-xs sm:text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto" />
                ) : (
                  "Sign Up"
                )}
              </button>
            </form>

            {/* Footer link */}
            <p className="text-center text-xs sm:text-sm text-muted mt-4 sm:mt-5">
              Got an account?{" "}
              <Link href="/sign-in" className="text-cta hover:underline font-medium">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
