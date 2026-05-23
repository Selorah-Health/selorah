import type { LandingFeatureCard } from '../../types/landing';

export const BUILT_FOR_EVERYONE_CARDS: LandingFeatureCard[] = [
  {
    id: 'patients',
    title: 'For Patients',
    desc: 'Take full ownership of your medical history. Share it instantly. Revoke access immediately. Earn from contributing your anonymised data to research.',
    features: [
      'Encrypted records on your device',
      'QR-based sharing with any provider',
      'Emergency profile always accessible',
      'Family health vault (up to 6 members)',
      'Monthly research earnings',
    ],
    iconKey: 'patient',
  },
  {
    id: 'hospitals',
    title: 'For Hospitals & Clinics',
    desc: "Stop asking patients for records they don't have. Scan a QR and see their verified history instantly — on any device, no installation required.",
    features: [
      'Instant QR scan access',
      'Verified record provenance badges',
      'Add & cosign records directly',
      'Staff roles & permissions',
      'FHIR R4 EMR integration',
    ],
    iconKey: 'hospital',
  },
  {
    id: 'researchers',
    title: 'For Researchers & Insurers',
    desc: 'Access consented, longitudinal African health data. 75% of every study budget goes directly to patients. The split is enforced by smart contract — immutable.',
    features: [
      'IRB-verified researchers only',
      'Differential privacy enforced',
      'Real-time cohort size estimates',
      'Automatic monthly patient payouts',
      'Fraud detection tools for insurers',
    ],
    iconKey: 'research',
  },
];