import { useCallback, useEffect, useState } from 'react';
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

type EmergencyContact = { name?: string; phone?: string; relationship?: string };

type CardProfile = {
  id: string;
  permanent_qr_token: string;
  full_name: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  height?: string | null;
  weight?: string | null;
  blood_group: string | null;
  genotype: string | null;
  allergies: string[] | string | null;
  emergency_contacts: EmergencyContact[] | null;
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

type CardImages = {
  front: string;
  back: string;
};

const CARD_WIDTH = 1050;
const CARD_HEIGHT = 600;
const CARD_BLUE = '#4269F5';
const CARD_VALUE = '#6183FF';
const CARD_LABEL = '#333333';

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`The card artwork at ${src} could not be loaded.`));
    image.src = src;
  });
}

function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  weight = 600
) {
  let size = startSize;
  do {
    ctx.font = `${weight} ${size}px Sora, system-ui, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  } while (size > 12);
  return size;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function formatDob(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  const age = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  );
  return `${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} (${age}/yo)`;
}

function firstWord(name?: string | null) {
  return (name || '').trim().split(/\s+/)[0] || 'Your';
}

function allergyText(allergies: CardProfile['allergies']) {
  if (Array.isArray(allergies)) {
    return allergies.map((item) => String(item).trim()).filter(Boolean).join(', ') || 'None';
  }
  if (typeof allergies === 'string') return allergies.trim() || 'None';
  return 'None';
}

function contactDetailLine(contact: EmergencyContact) {
  return [contact.relationship?.trim(), contact.phone?.trim()].filter(Boolean).join(' - ');
}

async function buildCardImages(
  profile: CardProfile,
  qrCanvas: HTMLCanvasElement
): Promise<CardImages> {
  const [frontTemplate, backTemplate] = await Promise.all([
    loadImage('/card/selorah-card-front.png'),
    loadImage('/card/selorah-card-back.png'),
  ]);
  const name = profile.full_name?.trim() || 'Selorah member';

  const front = document.createElement('canvas');
  front.width = CARD_WIDTH;
  front.height = CARD_HEIGHT;
  const frontCtx = front.getContext('2d');
  if (!frontCtx) throw new Error('Canvas is not available in this browser.');
  frontCtx.drawImage(frontTemplate, 0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Clear the old QR inside the white frame, draw the signed-in patient's
  // code, then restore the rounded frame on top.
  frontCtx.fillStyle = CARD_BLUE;
  frontCtx.fillRect(357, 97, 334, 334);
  frontCtx.drawImage(qrCanvas, 365, 105, 320, 320);
  frontCtx.beginPath();
  frontCtx.roundRect(354, 94, 340, 340, 26);
  frontCtx.lineWidth = 6;
  frontCtx.strokeStyle = '#FFFFFF';
  frontCtx.stroke();

  // Copy a clean strip of the template over the sample name, then write the
  // patient name in the same position and colour.
  frontCtx.drawImage(frontTemplate, 40, 445, 400, 47, 40, 496, 400, 76);
  frontCtx.fillStyle = '#FFFFFF';
  frontCtx.textAlign = 'left';
  frontCtx.textBaseline = 'middle';
  fitFont(frontCtx, name, 390, 38, 500);
  frontCtx.fillText(name, 48, 531);

  const back = document.createElement('canvas');
  back.width = CARD_WIDTH;
  back.height = CARD_HEIGHT;
  const backCtx = back.getContext('2d');
  if (!backCtx) throw new Error('Canvas is not available in this browser.');
  backCtx.drawImage(backTemplate, 0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Repaint the header strip with the template gradient, then write the
  // patient-specific title.
  const titleGradient = backCtx.createLinearGradient(0, 0, CARD_WIDTH, 0);
  titleGradient.addColorStop(0, '#4269F5');
  titleGradient.addColorStop(0.5, '#446BF6');
  titleGradient.addColorStop(1, '#567AFB');
  backCtx.fillStyle = titleGradient;
  backCtx.fillRect(0, 0, CARD_WIDTH, 98);

  backCtx.fillStyle = '#FFFFFF';
  backCtx.textAlign = 'center';
  backCtx.textBaseline = 'alphabetic';
  const title = `${firstWord(name)}'s Emergency Information`;
  fitFont(backCtx, title, 860, 44, 500);
  backCtx.fillText(title, 525, 77);

  // Clear the sample fields but keep the white panel edges and the divider.
  backCtx.fillStyle = '#FFFFFF';
  backCtx.fillRect(80, 120, 480, 410);
  backCtx.fillRect(590, 120, 400, 410);

  const label = (text: string, x: number, y: number) => {
    backCtx.font = '500 20px Sora, system-ui, sans-serif';
    backCtx.fillStyle = CARD_LABEL;
    backCtx.textAlign = 'left';
    backCtx.textBaseline = 'alphabetic';
    backCtx.fillText(text, x, y);
  };

  const value = (text: string, x: number, y: number, maxWidth: number, size = 32) => {
    backCtx.fillStyle = CARD_VALUE;
    backCtx.textAlign = 'left';
    backCtx.textBaseline = 'alphabetic';
    fitFont(backCtx, text, maxWidth, size, 600);
    backCtx.fillText(text, x, y);
  };

  label('NAME', 108, 173);
  value(name, 106, 218, 430);

  label('DATE OF BIRTH', 108, 265);
  value(formatDob(profile.date_of_birth), 107, 316, 450);

  label('HEIGHT', 108, 356);
  label('WEIGHT', 241, 356);
  value(profile.height?.trim() || 'Not set', 106, 400, 120);
  value(profile.weight?.trim() || 'Not set', 242, 400, 120);

  label('BLOOD GROUP', 108, 447);
  label('GENOTYPE', 290, 447);
  value(profile.blood_group?.trim() || 'Not set', 107, 491, 170);
  value(profile.genotype?.trim() || 'Not set', 302, 491, 150);

  label('ALLERGIES', 626, 174);
  backCtx.fillStyle = CARD_VALUE;
  backCtx.font = '600 30px Sora, system-ui, sans-serif';
  const allergyLines = wrapText(backCtx, allergyText(profile.allergies), 340).slice(0, 2);
  allergyLines.forEach((line, index) => {
    value(line, 628, 218 + index * 28, 340, 30);
  });

  label('EMERGENCY CONTACTS', 626, 265);
  const contacts = Array.isArray(profile.emergency_contacts)
    ? profile.emergency_contacts.slice(0, 3)
    : [];

  if (contacts.length) {
    contacts.forEach((contact, index) => {
      const y = 307 + index * 66;
      value(contact.name?.trim() || 'Emergency contact', 628, y, 340, 24);
      value(contactDetailLine(contact) || 'No phone on file', 628, y + 27, 340, 20);
    });
  } else {
    value('None', 628, 309, 340, 30);
  }

  return {
    front: front.toDataURL('image/png'),
    back: back.toDataURL('image/png'),
  };
}

export default function SelorahCard() {
  const supabase = createClient();
  const { success, error: toastError, info } = useToast();
  const [profile, setProfile] = useState<CardProfile | null>(null);
  const [order, setOrder] = useState<CardOrder | null>(null);
  const [cards, setCards] = useState<CardImages | null>(null);
  const [generating, setGenerating] = useState(false);
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
    let cancelled = false;
    void load();

    // The dashboard and this page mount together, so the first auth read can
    // happen before Supabase restores the stored session. Reload when it does.
    const { data } = supabase.auth.onAuthStateChange(() => {
      if (!cancelled) void load();
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [load, supabase]);

  const token = profile?.permanent_qr_token || '';

  useEffect(() => {
    if (!profile || !token) {
      setCards(null);
      return;
    }

    let cancelled = false;
    setGenerating(true);

    const run = async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready;

        let qrCanvas: HTMLCanvasElement | null = null;
        for (let attempt = 0; attempt < 20; attempt += 1) {
          qrCanvas = document.getElementById('selorah-card-qr') as HTMLCanvasElement | null;
          if (qrCanvas) break;
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        if (!qrCanvas) throw new Error('The QR code is still rendering. Try again in a moment.');

        const images = await buildCardImages(profile, qrCanvas);
        if (!cancelled) setCards(images);
      } catch (err) {
        if (!cancelled) {
          setCards(null);
          toastError(
            err instanceof Error ? err.message : 'The card preview could not be generated.'
          );
        }
      } finally {
        if (!cancelled) setGenerating(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [profile, token, toastError]);

  const saveImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  };

  const downloadCard = () => {
    if (!cards) {
      info('The card is still rendering. Try again in a moment.');
      return;
    }
    saveImage(cards.front, 'selorah-card-front.png');
  };

  const downloadBack = () => {
    if (!cards) {
      info('The card is still rendering. Try again in a moment.');
      return;
    }
    saveImage(cards.back, 'selorah-card-back.png');
  };

  const downloadBoth = () => {
    if (!cards) {
      info('The card is still rendering. Try again in a moment.');
      return;
    }
    saveImage(cards.front, 'selorah-card-front.png');
    window.setTimeout(() => saveImage(cards.back, 'selorah-card-back.png'), 250);
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

  return (
    <div className="space-y-6 font-sora">
      <div className="hidden" aria-hidden>
        <QRCodeCanvas
          id="selorah-card-qr"
          value={sharedUrl(token)}
          size={640}
          level="H"
          bgColor={CARD_BLUE}
          fgColor="#FFFFFF"
          marginSize={1}
        />
      </div>

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
          onClick={downloadBoth}
          disabled={generating || !cards}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 text-xs font-bold text-[#101217] transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          {generating ? 'Building card...' : 'Download card'}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="rounded-[28px] border border-gray-100 bg-white p-3 shadow-xl shadow-[#101217]/5 sm:p-4">
            {cards ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 px-1 pb-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-400">
                      Front
                    </p>
                    <button
                      type="button"
                      onClick={downloadCard}
                      className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-gray-200 px-3 text-[10px] font-bold text-gray-500 transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF]"
                    >
                      <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                      Download
                    </button>
                  </div>
                  <img
                    src={cards.front}
                    alt="Front of your Selorah emergency card"
                    className="w-full rounded-[18px]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2 px-1 pb-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-400">
                      Back
                    </p>
                    <button
                      type="button"
                      onClick={downloadBack}
                      className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-gray-200 px-3 text-[10px] font-bold text-gray-500 transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF]"
                    >
                      <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                      Download
                    </button>
                  </div>
                  <img
                    src={cards.back}
                    alt="Back of your Selorah emergency card"
                    className="w-full rounded-[18px]"
                  />
                </div>
              </div>
            ) : (
              <div className="flex aspect-[7/4] items-center justify-center rounded-[18px] bg-[#F4F7FF]">
                <div className="text-center">
                  <QrCodeIcon className="mx-auto h-8 w-8 text-[#6183FF]" />
                  <p className="mt-2 text-xs font-semibold text-gray-400">
                    {generating ? 'Building your card...' : 'Card preview unavailable'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="mt-2 px-1 text-[10px] font-medium leading-relaxed text-gray-400">
            The download uses this exact design. Only your QR code, name, and health details change.
          </p>

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
