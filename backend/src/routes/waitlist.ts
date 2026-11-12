import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabaseClient';

const router = Router();

function normalizeWaitlistRole(role?: string) {
  const value = (role || '').trim().toLowerCase();
  if (value === 'doctor' || value === 'clinician') return 'doctor';
  if (value === 'hospital' || value === 'provider' || value === 'clinic') return 'hospital';
  return 'patient';
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, fullName, role, source, details } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ error: 'Email and Full Name are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(fullName).trim();
    const normalizedRole = normalizeWaitlistRole(role);
    const cleanDetails =
      details && typeof details === 'object' && !Array.isArray(details) ? details : {};

    const { data: rpcData, error: rpcError } = await supabase.rpc('join_waitlist', {
      p_email: cleanEmail,
      p_full_name: cleanName,
      p_role: normalizedRole,
      p_source: source || 'api',
      p_details: cleanDetails,
    });

    if (!rpcError && rpcData) {
      const payload = rpcData as { already_on_list?: boolean };
      const already = Boolean(payload.already_on_list);

      return res.status(already ? 200 : 201).json({
        success: true,
        alreadyOnWaitlist: already,
        message: already
          ? 'You are already on the waitlist. Share Selorah with someone who needs it.'
          : 'Added to waitlist',
      });
    }

    const attempts: Record<string, unknown>[] = [
      {
        email: cleanEmail,
        full_name: cleanName,
        role: normalizedRole,
        source: source || 'api',
        details: cleanDetails,
      },
      {
        email: cleanEmail,
        full_name: cleanName,
        role: normalizedRole,
        source: source || 'api',
      },
      {
        email: cleanEmail,
        full_name: cleanName,
        role: normalizedRole,
      },
      {
        email: cleanEmail,
        full_name: cleanName,
      },
    ];

    let lastError: { code?: string; message?: string } | null = null;

    for (const row of attempts) {
      const { error } = await supabase.from('waitlist').insert(row);

      if (!error) {
        return res.status(201).json({
          success: true,
          alreadyOnWaitlist: false,
          message: 'Added to waitlist',
        });
      }

      lastError = error;

      if (error.code === '23505') {
        return res.status(200).json({
          success: true,
          alreadyOnWaitlist: true,
          message: 'You are already on the waitlist. Share Selorah with someone who needs it.',
        });
      }

      if (/column .* does not exist/i.test(error.message)) continue;
      break;
    }

    throw lastError || new Error('Could not join waitlist');
  } catch (error: any) {
    console.error('Waitlist error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
