"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "patient";

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    dob: "",
    address: "",
    whatsapp: "",
    bloodType: "",
    allergies: "",
    height: "",
    weight: "",
    licenseNumber: "", // for strict roles
    hospitalAffiliation: "", // for strict roles
    specialty: "", // for strict roles
  });

  const isStrictRole = role === "provider" || role === "researcher" || role === "insurer";

  const updateForm = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
    else handleComplete();
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    // Navigate to their respective dashboard
    router.push(`/${role}`);
  };

  return (
    <div className="w-full max-w-xl mx-auto py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="font-bold text-2xl tracking-tight text-foreground">Selorah.</span>
          </Link>
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
            Step {step} of 4
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 w-full bg-[var(--border)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-3xl p-8 shadow-xl shadow-black/5 min-h-[400px] flex flex-col">
        <div className="flex-1">
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-2xl font-bold mb-2 text-foreground">Let's get to know you</h1>
              <p className="text-muted text-sm mb-8">Basic details help us set up your profile properly.</p>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wide">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => updateForm("dob", e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wide">Home Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateForm("address", e.target.value)}
                    placeholder="123 Health Ave, City"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wide">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => updateForm("whatsapp", e.target.value)}
                    placeholder="+234..."
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                  />
                  <p className="text-[10px] text-muted mt-1.5 uppercase font-bold tracking-wider">Used for critical offline updates</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Strict/Mild Fork */}
          {step === 2 && !isStrictRole && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-2xl font-bold mb-2 text-foreground">Your Vitals</h1>
              <p className="text-muted text-sm mb-8">Fill these out so hospitals can access them instantly in emergencies.</p>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wide">Height (cm)</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => updateForm("height", e.target.value)}
                    placeholder="175"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wide">Weight (kg)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => updateForm("weight", e.target.value)}
                    placeholder="70"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wide">Blood Type</label>
                  <select
                    value={formData.bloodType}
                    onChange={(e) => updateForm("bloodType", e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                  >
                    <option value="">Select blood type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && isStrictRole && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-2xl font-bold mb-2 text-foreground">Professional Verification</h1>
              <p className="text-muted text-sm mb-8">As a {role}, we need to verify your credentials to grant system access.</p>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wide">License / Registration No.</label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => updateForm("licenseNumber", e.target.value)}
                    placeholder="MDCN-123456"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wide">Hospital / Organization Affiliation</label>
                  <input
                    type="text"
                    value={formData.hospitalAffiliation}
                    onChange={(e) => updateForm("hospitalAffiliation", e.target.value)}
                    placeholder="Lagos University Teaching Hospital"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wide">Specialty (Optional)</label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => updateForm("specialty", e.target.value)}
                    placeholder="Cardiology"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Allergies (Patients) or Agreement (Providers) */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-2xl font-bold mb-2 text-foreground">
                {!isStrictRole ? "Any Allergies?" : "Terms of Data Access"}
              </h1>
              <p className="text-muted text-sm mb-8">
                {!isStrictRole 
                  ? "List any known allergies to medications or environment." 
                  : "You must agree to HIPAA/NDPR guidelines before accessing patient records."}
              </p>
              
              {!isStrictRole ? (
                <div>
                  <textarea
                    value={formData.allergies}
                    onChange={(e) => updateForm("allergies", e.target.value)}
                    placeholder="E.g., Penicillin, Peanuts (leave blank if none)"
                    rows={4}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>
              ) : (
                <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 text-sm text-foreground overflow-y-auto h-40">
                  <p className="font-bold mb-2">Data Privacy Agreement</p>
                  <p className="mb-4">By continuing, I swear that all data access will be strictly for authorized clinical or administrative use.</p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-primary rounded outline-none" required />
                    <span className="font-medium">I agree to full compliance.</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Success/Final */}
          {step === 4 && (
            <div className="animate-in zoom-in-95 duration-500 text-center pt-8">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100/50">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2 text-foreground">You're all set!</h1>
              <p className="text-muted text-sm mb-8">Your profile has been secured. Welcome to Selorah.</p>
            </div>
          )}

        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border)]">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="px-6 py-3 rounded-xl font-bold text-sm text-muted hover:text-foreground transition-colors hover:bg-gray-50"
            >
              Back
            </button>
          ) : <div></div>}
          
          <button
            onClick={nextStep}
            className="px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:translate-y-px"
          >
            {step === 4 ? "Enter Dashboard" : "Continue"}
          </button>
        </div>

      </div>
    </div>
  );
}

// Wrapper to satisfy Next.js static rendering when using useSearchParams
export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted font-bold animate-pulse">Loading Onboarding...</div>}>
      <OnboardingFlow />
    </Suspense>
  )
}
