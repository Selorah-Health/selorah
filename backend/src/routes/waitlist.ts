import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabaseClient';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, fullName } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ error: 'Email and Full Name are required' });
    }

    const { error } = await supabase
      .from('waitlist')
      .insert({ email, full_name: fullName });

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ error: 'Email already on the waitlist' });
      }
      throw error;
    }

    res.status(201).json({ success: true, message: 'Added to waitlist' });
  } catch (error: any) {
    console.error('Waitlist error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
