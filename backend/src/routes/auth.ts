import { Router } from 'express';
import { generateUID } from '../services/authService';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Onboarding Payload Route
// Invoked from the frontend once user completes the Progressive Onboarding Form
router.post('/onboarding', async (req, res) => {
  try {
    const { 
      userId, // Auth UUID from Supabase
      role, 
      firstName, 
      lastName, 
      dob, 
      address, 
      whatsapp, 
      // Patient specifics
      bloodType, 
      height, 
      weight, 
      allergies,
      // Strict role specifics
      licenseNumber,
      hospitalAffiliation,
      specialty
    } = req.body;

    if (!userId || !role || !firstName || !lastName || !dob) {
      return res.status(400).json({ error: 'Missing required profile fields' });
    }

    // 1. Generate Custom Selorah UID
    const generatedUID = await generateUID(firstName, lastName, dob);

    // 2. Insert into core users table
    const { error: userError } = await supabase
      .from('users')
      .update({
        uid: generatedUID,
        role: role,
        onboarding_completed: true
      })
      .eq('id', userId);

    if (userError) throw userError;

    // 3. Insert into respective sub-schema tables based on Role
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
          is_verified: false // Admins verify later
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

export default router;
