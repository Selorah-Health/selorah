import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables at the very top
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Generates a unique Selorah Identity UID.
 */
export const generateUID = async (
  firstName: string,
  lastName: string,
  dob: string // Expected in YYYY-MM-DD
): Promise<string> => {
  const parts = dob.split('-');
  if (parts.length !== 3) {
    throw new Error('Invalid DOB format. Expected YYYY-MM-DD');
  }

  const [year, month, day] = parts;
  const dobSuffix = `${day}-${month}`;

  const safeFirst = firstName.replace(/[^a-zA-Z]/g, '');
  const safeLast = lastName.replace(/[^a-zA-Z]/g, '');

  let proposedUID = `${safeFirst}${dobSuffix}`;

  let isAvailable = await checkAvailability(proposedUID);
  if (isAvailable) return proposedUID;

  proposedUID = `${safeFirst}${dobSuffix}-${safeLast}`;
  isAvailable = await checkAvailability(proposedUID);
  if (isAvailable) return proposedUID;

  let seq = 1;
  while (true) {
    proposedUID = `${safeFirst}${dobSuffix}-${seq}`;
    isAvailable = await checkAvailability(proposedUID);
    if (isAvailable) return proposedUID;
    seq++;
  }
};

const checkAvailability = async (uid: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('uid', uid)
    .maybeSingle();

  if (error) {
    console.error('Error checking UID availability:', error);
    return false;
  }

  return data === null;
};

// ====================== SIGN UP ======================
export const signUp = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  dob: string
) => {
  try {
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    // 2. Generate custom Selorah UID
    const uid = await generateUID(firstName, lastName, dob);

    // 3. Insert into public users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        uid: uid,
        email: email,
        first_name: firstName,
        last_name: lastName,
        dob: dob,
        role: null,                    // Will be set during onboarding
        onboarding_completed: false,
      });

    if (userError) throw userError;

    return {
      user: authData.user,
      uid: uid,
      error: null,
    };
  } catch (error: any) {
    console.error('SignUp Error:', error);
    return {
      user: null,
      uid: null,
      error: error.message || 'Signup failed',
    };
  }
};

// ====================== SIGN IN ======================
export const signIn = async (email: string, password: string) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;

    // Get additional user details
    const { data: userDetails, error: detailsError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (detailsError) {
      console.warn('Could not fetch user details:', detailsError);
    }

    return {
      user: authData.user,
      userDetails: userDetails || null,
      error: null,
    };
  } catch (error: any) {
    console.error('SignIn Error:', error);
    return {
      user: null,
      userDetails: null,
      error: error.message || 'Invalid email or password',
    };
  }
};