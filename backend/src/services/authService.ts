import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Generates a unique Selorah Identity UID.
 * Standard format: FirstName-DD-MM
 * If collision: FirstName-DD-MM-LastName
 * If still collision: FirstName-DD-MM-Sequence
 */
export const generateUID = async (
  firstName: string,
  lastName: string,
  dob: string // Expected in YYYY-MM-DD
): Promise<string> => {
  // Extract DD-MM from Date of Birth
  const parts = dob.split('-');
  if (parts.length !== 3) {
    throw new Error('Invalid DOB format. Expected YYYY-MM-DD');
  }
  const [year, month, day] = parts;
  const dobSuffix = `${day}-${month}`;

  // Clean names
  const safeFirst = firstName.replace(/[^a-zA-Z]/g, '');
  const safeLast = lastName.replace(/[^a-zA-Z]/g, '');

  let proposedUID = `${safeFirst}${dobSuffix}`;

  // Check if standard format collision exists
  let isAvailable = await checkAvailability(proposedUID);
  if (isAvailable) return proposedUID;

  // Collision detected -> Fallback to Last Name
  proposedUID = `${safeFirst}${dobSuffix}-${safeLast}`;
  isAvailable = await checkAvailability(proposedUID);
  if (isAvailable) return proposedUID;

  // Final fallback -> Append sequence
  let seq = 1;
  while (!isAvailable) {
    proposedUID = `${safeFirst}${dobSuffix}-${seq}`;
    isAvailable = await checkAvailability(proposedUID);
    seq++;
  }

  return proposedUID;
};

const checkAvailability = async (uid: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('uid', uid)
    .single();

  // If no rows are found, the UID is available
  if (error && error.code === 'PGRST116') return true; 
  if (data) return false;
  return true;
};
