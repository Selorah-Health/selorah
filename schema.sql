-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE
-- Stores user information, roles, and KYC/Emergency data
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('patient', 'provider', 'researcher', 'insurer', 'developer', 'partner')),
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT UNIQUE, -- Used for WhatsApp login
    date_of_birth DATE,
    gender TEXT,
    is_pro BOOLEAN DEFAULT false,
    -- Patient Specific
    vitals JSONB,
    allergies JSONB,
    emergency_medical_info TEXT,
    emergency_contacts JSONB DEFAULT '[]'::jsonb, -- Max 3 standard, 5 pro
    -- Non-Patient KYC Specific
    organization_name TEXT,
    license_number TEXT,
    tax_id TEXT,
    official_email TEXT,
    kyc_status TEXT DEFAULT 'pending', -- pending, verified, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- MEDICAL RECORDS TABLE
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    name TEXT NOT NULL,
    record_type TEXT NOT NULL, -- e.g., 'Lab Result', 'Vaccination', 'Prescription'
    date DATE NOT NULL,
    status TEXT DEFAULT 'Private', -- Private, Shared Once, Shared
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own records" ON medical_records
    FOR ALL USING (auth.uid() = user_id);

-- ACCESS LOGS TABLE
CREATE TABLE access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    organization_name TEXT NOT NULL,
    action TEXT NOT NULL, -- e.g., 'viewed SNH Lab Result', 'gained access'
    color TEXT DEFAULT 'bg-[#3B82F6]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own access logs" ON access_logs
    FOR SELECT USING (auth.uid() = user_id);

-- NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id);

-- SHARED LINKS (FOR QR CODES)
CREATE TABLE shared_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token UUID UNIQUE DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    record_id UUID REFERENCES medical_records(id), -- Null means full history
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Shared links need to be readable by anyone with the token (no RLS for specific select)
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active shared links by token" ON shared_links
    FOR SELECT USING (is_active = true AND expires_at > NOW());
CREATE POLICY "Users can manage their own shared links" ON shared_links
    FOR ALL USING (auth.uid() = user_id);
