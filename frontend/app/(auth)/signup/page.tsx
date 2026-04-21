"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const handleAuthOption = (method: string) => {
    // Redirect to OTP page as requested for any option chosen
    router.push(`/otp?method=${method}`);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded bg-primary flex items-center justify-center text-white font-bold text-2xl">S</div>
          <span className="font-bold text-2xl tracking-tight text-foreground">Selorah.</span>
        </Link>
        <h1 className="text-2xl font-bold mb-2 text-foreground">Create your account</h1>
        <p className="text-muted text-sm">Join the network putting you in control</p>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-3xl p-8 shadow-xl shadow-black/5">
        <div className="space-y-4">
          
          <button
            onClick={() => handleAuthOption('email')}
            className="relative w-full flex items-center justify-center gap-3 bg-[var(--background)] hover:bg-gray-100 border border-[var(--border)] text-foreground font-bold text-sm rounded-xl py-4 transition-all"
          >
            <span className="absolute -top-3 -right-2 bg-green-100 text-green-700 border border-green-200 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full shadow-sm">
              Faster
            </span>
            <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Continue with Email
          </button>

          <button
            onClick={() => handleAuthOption('google')}
            className="w-full flex items-center justify-center gap-3 bg-[var(--background)] hover:bg-gray-100 border border-[var(--border)] text-foreground font-bold text-sm rounded-xl py-4 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px bg-[var(--border)] flex-1"></div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider">or</span>
            <div className="h-px bg-[var(--border)] flex-1"></div>
          </div>

          <button
            disabled
            className="w-full flex items-center justify-center gap-3 bg-[var(--background)] border border-[var(--border)] text-muted font-bold text-sm rounded-xl py-4 opacity-50 cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.79 2.12.04 3.65 1.05 4.5 2.59-3.9 2.05-3.1 7.6 1 9.02-1.01 2.37-2.3 4.29-4.17 1.35zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple
          </button>

        </div>

        <div className="mt-8 text-center text-sm font-medium text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:text-primary-hover transition-colors">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
