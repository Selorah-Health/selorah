#!/usr/bin/env node
/**
 * Create or update a confirmed @selorah.app CMS account.
 *
 * Usage:
 *   cd frontend
 *   SUPABASE_SERVICE_ROLE_KEY="..." node scripts/create-cms-user.mjs \
 *     name@selorah.app "a-strong-password" "First" "Last"
 *
 * The service role key is read from the environment. Never commit it.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../.env') });

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.argv[2] || '').trim().toLowerCase();
const password = process.argv[3] || '';
const firstName = (process.argv[4] || 'Selorah').trim();
const lastName = (process.argv[5] || 'Staff').trim();

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

if (!url) {
  fail('Set SUPABASE_URL or add VITE_SUPABASE_URL to frontend/.env.');
}
if (!serviceRoleKey) {
  fail(
    'Set SUPABASE_SERVICE_ROLE_KEY in the environment. Get it from Supabase, Project Settings, API. Never commit it.'
  );
}
if (!email.endsWith('@selorah.app')) {
  fail('Use a @selorah.app email address.');
}
if (password.length < 8) {
  fail('Use a password with at least 8 characters.');
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const fullName = `${firstName} ${lastName}`.trim();

async function findExistingUser() {
  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data?.users?.find(
      (user) => (user.email || '').toLowerCase() === email
    );
    if (match) return match;

    if (!data?.users || data.users.length < perPage) return null;
    page += 1;
  }

  return null;
}

async function main() {
  console.log(`Supabase: ${new URL(url).host}`);
  console.log(`Account:  ${email}`);

  const existing = await findExistingUser();
  let user;

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      app_metadata: { ...(existing.app_metadata || {}), role: 'admin' },
      user_metadata: {
        ...(existing.user_metadata || {}),
        first_name: firstName,
        last_name: lastName,
        role: 'admin',
      },
    });
    if (error) throw error;
    user = data.user;
    console.log('Updated the existing auth user.');
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: 'admin' },
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: 'admin',
      },
    });
    if (error) throw error;
    user = data.user;
    console.log('Created a confirmed auth user.');
  }

  if (!user) {
    fail('Supabase did not return a user.');
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email,
      role: 'admin',
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    console.warn(
      `\nThe auth user is ready, but the profiles row was not written: ${profileError.message}`
    );
    console.warn(
      'The @selorah.app domain rule still opens the CMS; the profile only supplies a display name.'
    );
  } else {
    console.log('Saved the profiles row.');
  }

  console.log(`\nUser id: ${user.id}`);
  console.log('Sign in at /login with this email and password.');
  console.log('Any @selorah.app account opens /cms automatically.');
}

main().catch((error) => {
  fail(error?.message || String(error));
});
