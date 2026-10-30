import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  CreditCardIcon,
  MapPinIcon,
  PhoneIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import { QRCodeCanvas } from 'qrcode.react';
import { createClient } from '../lib/supabase/client';
import { ensurePermanentToken, sharedUrl } from '../lib/qr';
import { useToast } from '../contexts/ToastContext';

type CardProfile = {
  id: string;
  permanent_qr_token: string;
  full_name: string | null;
  blood_group: string | null;
  genotype: string | null;
  allergies: string[] | null;
  emergency_contacts: Array<{ name?: string; phone?: string; relationship?: string }> | null;
};

type CardOrder = {
  id: string;
  full_name: string;
  phone: string;
  delivery_address: string;
  city: string | null;
  state: string | null;
  tier: string;
  status: string;
  created_at: string;
};

export default function SelorahCard() {
  const supabase = createClient();
  const { success, error: toastError, info } = useToast();
  const qrWrapRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<CardProfile | null>(null);
  const [order, setOrder] = useState<CardOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    tier: 'classic',
  });

  const load = useCallback(async () => {
    try {
      const nextProfile = (await ensurePermanentToken(supabase)) as CardProfile | null;
      setProfile(nextProfile);

      if (nextProfile) {
        const { data } = await supabase
          .from('card_orders')
          .select('id, full_name, phone, delivery_address, city, state, tier, status, created_at')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) setOrder(data as CardOrder);

        setForm((current) => ({
          ...current,
          fullName: current.fullName || nextProfile.full_name || '',
        }));
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Your card could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [supabase, toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  const downloadCard = () => {
    const canvas = qrWrapRef.current?.querySelector('canvas');
    if (!canvas) {
      info('The QR code is still rendering. Try again in a moment.');
      return;
    }
    const link = document.createElement('a');
    link.download = 'selorah-emergency-card.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const submitOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;

    if (form.fullName.trim().length < 3) {
      toastError('Enter the name that should appear on the card.');
      return;
    }
    if (form.phone.replace(/\D/g, '').length < 10) {
      toastError('Enter a valid delivery phone number.');
      return;
    }
    if (form.address.trim().length < 8) {
      toastError('Enter a delivery address.');
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in again to order a card.');

      const { data, error } = await supabase
        .from('card_orders')
        .insert({
          user_id: user.id,
          patient_id: profile.id,
          full_name: form.fullName.trim(),
          phone: form.phone.trim(),
          delivery_address: form.address.trim(),
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          tier: form.tier,
          status: 'requested',
        })
        .select('id, full_name, phone, delivery_address, city, state, tier, status, created_at')
        .single();

      if (error) throw error;
      setOrder(data as CardOrder);
      success('Card request received. We will contact you about delivery.');
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'The card request could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-64 animate-pulse rounded-[28px] bg-white" />;
  }

  if (!profile?.permanent_qr_token) {
    return (
      <div className="rounded-[28px] border border-gray-50 bg-white p-8 text-center shadow-sm">
        <QrCodeIcon className="mx-auto h-10 w-10 text-[#6183FF]" />
        <h2 className="mt-3 text-lg font-bold text-[#101217]">Your card is being prepared</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm font-medium text-gray-400">
          Finish your profile so we can generate your permanent emergency QR code.
        </p>
      </div>
    );
  }

  const token = profile.permanent_qr_token;
  const emergency = profile.emergency_contacts?.[0];
  const allergies = Array.isArray(profile.allergies) ? profile.allergies.join(', ') : '';

  return (
    <div className="space-y-6 font-sora">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#6183FF]">
            Emergency identity
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">
            Your Selorah card
          </h2>
          <p className="mt-1 max-w-xl text-sm font-medium text-gray-400">
            One permanent QR code for emergencies. It works even when your phone is locked or the
            app is offline.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadCard}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 text-xs font-bold text-[#101217] transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF]"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Save QR image
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="relative overflow-hidden rounded-[28px] bg-[#020924] p-6 text-white shadow-xl shadow-[#020924]/20 sm:p-8">
            <div
              aria-hidden
              className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#6183FF]/30 blur-3xl"
            />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <img src="/logo.svg" alt="" className="h-8 w-8 object-contain" />
                  <span className="text-sm font-bold tracking-tight">Selorah Health</span>
                </div>
                <p className="mt-5 text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                  Emergency medical card
                </p>
                <p className="mt-1 text-xl font-bold tracking-tight">
                  {profile.full_name || 'Selorah member'}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-2.5" ref={qrWrapRef}>
                <QRCodeCanvas
                  value={sharedUrl(token)}
                  size={112}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: '/logo.svg',
                    x: undefined,
                    y: undefined,
                    height: 24,
                    width: 24,
                    excavate: true,
                  }}
                />
              </div>
            </div>

            <div className="relative mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/35">
                  Blood group
                </p>
                <p className="mt-1 text-sm font-bold">{profile.blood_group || 'Not set'}</p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/35">
                  Genotype
                </p>
                <p className="mt-1 text-sm font-bold">{profile.genotype || 'Not set'}</p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/35">
                  Allergies
                </p>
                <p className="mt-1 truncate text-sm font-bold">{allergies || 'None recorded'}</p>
              </div>
            </div>

            <div className="relative mt-4 rounded-2xl bg-white/5 p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/35">
                Emergency contact
              </p>
              <p className="mt-1 text-xs font-bold">
                {emergency?.name || 'Add a contact in settings'}
                {emergency?.relationship ? ` (${emergency.relationship})` : ''}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-white/50">
                {emergency?.phone || 'No phone on file'}
              </p>
            </div>

            <p className="relative mt-4 text-[9px] font-medium leading-relaxed text-white/35">
              Scan to view emergency details. Access is logged and can be revoked from your access
              log.
            </p>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#6183FF]/15 bg-[#EEF2FF] p-4">
            <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#6183FF]" />
            <div>
              <p className="text-xs font-bold text-[#101217]">Permanent and revocable</p>
              <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-gray-500">
                This code never expires, but every device that scans it becomes a grant you can
                revoke in Access log.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          {order ? (
            <div className="rounded-[28px] border border-gray-50 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAFBF2] text-[#15955C]">
                  <CheckCircleIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-[#101217]">Card request received</p>
                  <p className="text-[11px] font-medium text-gray-400">
                    Status: {order.status.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-xs font-medium text-gray-500">
                <p className="flex items-center gap-2">
                  <CreditCardIcon className="h-4 w-4 text-[#6183FF]" />
                  {order.tier === 'pro' ? 'Pro metal card' : 'Classic card'}
                </p>
                <p className="flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 text-[#6183FF]" />
                  {order.phone}
                </p>
                <p className="flex items-start gap-2">
                  <MapPinIcon className="h-4 w-4 shrink-0 text-[#6183FF]" />
                  <span>
                    {order.delivery_address}
                    {order.city ? `, ${order.city}` : ''}
                    {order.state ? `, ${order.state}` : ''}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <TruckIcon className="h-4 w-4 text-[#6183FF]" />
                  Delivery is arranged after your details are confirmed.
                </p>
              </div>
            </div>
          ) : (
            <form
              onSubmit={submitOrder}
              className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-6"
            >
              <h3 className="text-base font-bold tracking-tight text-[#101217]">
                Order a physical card
              </h3>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-400">
                A durable card with your permanent QR code, blood group, and emergency contact.
              </p>

              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.12em] text-gray-400">
                    Name on card
                  </span>
                  <input
                    value={form.fullName}
                    onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                    className="min-h-[44px] w-full rounded-xl border border-gray-200 px-3.5 text-xs font-semibold outline-none focus:border-[#6183FF]"
                    placeholder="Full name"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.12em] text-gray-400">
                    Phone
                  </span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    className="min-h-[44px] w-full rounded-xl border border-gray-200 px-3.5 text-xs font-semibold outline-none focus:border-[#6183FF]"
                    placeholder="080 0000 0000"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.12em] text-gray-400">
                    Delivery address
                  </span>
                  <textarea
                    value={form.address}
                    onChange={(event) => setForm({ ...form, address: event.target.value })}
                    rows={2}
                    className="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-[#6183FF]"
                    placeholder="Street, area, landmark"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={form.city}
                    onChange={(event) => setForm({ ...form, city: event.target.value })}
                    className="min-h-[44px] w-full rounded-xl border border-gray-200 px-3.5 text-xs font-semibold outline-none focus:border-[#6183FF]"
                    placeholder="City"
                  />
                  <input
                    value={form.state}
                    onChange={(event) => setForm({ ...form, state: event.target.value })}
                    className="min-h-[44px] w-full rounded-xl border border-gray-200 px-3.5 text-xs font-semibold outline-none focus:border-[#6183FF]"
                    placeholder="State"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'classic', label: 'Classic' },
                    { id: 'pro', label: 'Pro metal' },
                  ].map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setForm({ ...form, tier: tier.id })}
                      className={`min-h-[44px] rounded-xl border text-xs font-bold transition-colors ${
                        form.tier === tier.id
                          ? 'border-[#6183FF] bg-[#EEF2FF] text-[#6183FF]'
                          : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-4 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[#6183FF] text-sm font-bold text-white shadow-lg shadow-[#6183FF]/20 disabled:opacity-60"
              >
                <CreditCardIcon className="h-4 w-4" />
                {saving ? 'Sending request...' : 'Request my card'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
