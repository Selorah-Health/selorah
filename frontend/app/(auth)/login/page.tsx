"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate login
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 1500);
  };

  const handleGoogleSignIn = () => {
    // Simulate Google Sign-in
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded bg-primary flex items-center justify-center text-white font-bold text-2xl">S</div>
          <span className="font-bold text-2xl tracking-tight text-foreground">Selorah.</span>
        </Link>
        <h1 className="text-2xl font-bold mb-2 text-foreground">Welcome back</h1>
        <p className="text-muted text-sm">Sign in to your Selorah account</p>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-3xl p-8 shadow-xl shadow-black/5">
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wide">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              placeholder="+234 800 000 0000"
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-foreground text-sm placeholder-muted outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-foreground text-sm placeholder-muted outline-none focus:border-primary transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold text-sm rounded-xl py-3.5 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:translate-y-px"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px bg-[var(--border)] flex-1"></div>
          <span className="text-xs font-bold text-muted uppercase tracking-wider">or sign in with</span>
          <div className="h-px bg-[var(--border)] flex-1"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-[var(--background)] hover:bg-gray-100 border border-[var(--border)] text-foreground font-bold text-sm rounded-xl py-3.5 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        <div className="mt-8 text-center text-sm font-medium text-muted">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary hover:text-primary-hover transition-colors">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
