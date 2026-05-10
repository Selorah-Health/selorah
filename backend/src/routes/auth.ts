import { Router, Request, Response } from 'express';
import { generateUID, signUp, signIn } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// ====================== ONBOARDING ======================
router.post('/onboarding', async (req: Request, res: Response) => {
  try {
    const { 
      userId,
      role, 
      firstName, 
      lastName, 
      dob, 
      address, 
      whatsapp, 
      bloodType, 
      height, 
      weight, 
      allergies,
      licenseNumber,
      hospitalAffiliation,
      specialty
    } = req.body;

    if (!userId || !role || !firstName || !lastName || !dob) {
      return res.status(400).json({ error: 'Missing required profile fields' });
    }

    const generatedUID = await generateUID(firstName, lastName, dob);

    // Update core users table
    const { error: userError } = await supabase
      .from('users')
      .update({
        uid: generatedUID,
        role: role,
        onboarding_completed: true
      })
      .eq('id', userId);

    if (userError) throw userError;

    // Insert role-specific data
    if (role === 'patient') {
      const { error: patientError } = await supabase
        .from('patients')
        .insert({
          id: userId,
          address,
          whatsapp,
          blood_type: bloodType,
          height,
          weight,
          allergies
        });
      if (patientError) throw patientError;
      
    } else if (role === 'provider') {
      const { error: providerError } = await supabase
        .from('providers')
        .insert({
          id: userId,
          license_number: licenseNumber,
          hospital_affiliation: hospitalAffiliation,
          specialty,
          is_verified: false
        });
      if (providerError) throw providerError;
    }

    res.status(200).json({ 
      success: true, 
      message: 'Onboarding complete',
      uid: generatedUID
    });

  } catch (error: any) {
    console.error('Onboarding error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// ====================== SIGNUP ======================
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, dob } = req.body;

    if (!email || !password || !firstName || !lastName || !dob) {
      return res.status(400).json({ error: 'Missing required signup fields' });
    }

    const result = await signUp(email, password, firstName, lastName, dob);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({ 
      message: 'User signed up successfully', 
      user: { 
        id: result.user?.id, 
        email: result.user?.email, 
        uid: result.uid 
      } 
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// ====================== LOGIN ======================
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const result = await signIn(email, password);

    if (result.error) {
      return res.status(401).json({ error: result.error });
    }

    res.status(200).json({ 
      message: 'User logged in successfully', 
      user: { 
        id: result.user?.id, 
        email: result.user?.email 
      }, 
      userDetails: result.userDetails 
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;