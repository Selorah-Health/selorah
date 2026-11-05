export const CAREERS_EMAIL = 'support@selorah.app';

export type CareerRole = {
  slug: string;
  title: string;
  location: string;
  type: string;
  team: string;
  summary: string;
  skills: string[];
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
};

export const CAREER_ROLES: CareerRole[] = [
  {
    slug: 'senior-fullstack-engineer',
    title: 'Senior Fullstack Engineer',
    location: 'Remote',
    type: 'Full-time',
    team: 'Engineering',
    summary:
      'Build the secure record vault, sharing flows, and provider integrations. You will work across React, TypeScript, Postgres, and Supabase edge functions.',
    skills: ['React', 'TypeScript', 'Postgres', 'Supabase', 'Security'],
    responsibilities: [
      'Design and ship patient facing features across the web app and edge functions.',
      'Own data models, access rules, and audit trails for sensitive health records.',
      'Build reliable sharing flows for QR access, time limited links, and provider review.',
      'Review code, write tests, and keep the platform fast on low bandwidth connections.',
      'Work with design and clinical advisors to turn messy workflows into clear screens.',
    ],
    requirements: [
      '4 or more years building production web applications.',
      'Strong React and TypeScript skills, with a good eye for accessibility and performance.',
      'Comfort with relational databases, migrations, and row level security.',
      'A security minded approach to authentication, authorization, and personal data.',
      'Clear written communication and the ability to work independently in a remote team.',
    ],
    niceToHave: [
      'Experience with Supabase, Postgres policies, or edge functions.',
      'Background in health tech, fintech, or another regulated industry.',
      'Experience with offline first web apps and service workers.',
    ],
  },
  {
    slug: 'product-designer',
    title: 'Product Designer',
    location: 'Lagos or remote',
    type: 'Full-time',
    team: 'Design',
    summary:
      'Own the end-to-end product experience for patients, clinicians, researchers, and insurers. Turn dense medical workflows into calm, clear screens.',
    skills: ['Product design', 'Design systems', 'Research', 'Prototyping'],
    responsibilities: [
      'Lead design for core patient and provider journeys from discovery to launch.',
      'Turn research and clinical feedback into flows, wireframes, and polished interfaces.',
      'Maintain and extend the Selorah design system across web and mobile web.',
      'Prototype quickly and test with real users, including low literacy and low bandwidth users.',
      'Work closely with engineers to protect quality through implementation.',
    ],
    requirements: [
      'A portfolio showing end to end product work, not only visual screens.',
      '3 or more years designing digital products for real users.',
      'Strong interaction design, information architecture, and visual craft.',
      'Comfort running user interviews, usability tests, and synthesis.',
      'Experience working with engineering teams and design systems.',
    ],
    niceToHave: [
      'Experience in health, civic tech, or another complex service industry.',
      'Motion design or illustration skills.',
      'Familiarity with accessibility standards and inclusive design.',
    ],
  },
  {
    slug: 'medical-data-analyst',
    title: 'Medical Data Analyst',
    location: 'Remote',
    type: 'Part-time',
    team: 'Clinical and Data',
    summary:
      'Help us structure clinical data, review record quality, and build privacy-preserving insights for research partners.',
    skills: ['Clinical data', 'SQL', 'Data quality', 'Privacy'],
    responsibilities: [
      'Review de-identified datasets for clinical accuracy and consistency.',
      'Define data quality checks for lab results, diagnoses, prescriptions, and visit records.',
      'Work with engineers to map source records into a clean, usable structure.',
      'Support research partners with cohort definitions and aggregate summaries.',
      'Document assumptions and flag edge cases that could affect patient safety.',
    ],
    requirements: [
      'A clinical, public health, or health informatics background.',
      'Working knowledge of SQL and spreadsheet based analysis.',
      'Experience handling sensitive data with care and discretion.',
      'Strong attention to detail and clear documentation habits.',
      'Ability to work part time with a remote team across Nigerian time zones.',
    ],
    niceToHave: [
      'Experience with FHIR, HL7, or electronic medical records.',
      'Familiarity with statistics or epidemiological methods.',
      'Experience preparing data for ethics or IRB review.',
    ],
  },
  {
    slug: 'blockchain-engineer',
    title: 'Blockchain Engineer',
    location: 'Remote',
    type: 'Full-time',
    team: 'Engineering',
    summary:
      'Design auditable, privacy-preserving record anchoring and consent proofs without putting patient data on chain.',
    skills: ['Solidity', 'Cryptography', 'Distributed systems', 'Security'],
    responsibilities: [
      'Design and ship a minimal registry that stores only hashes, timestamps, and consent proofs.',
      'Build safe wallet and transaction flows for patients and institutions.',
      'Write and test smart contracts, deployment scripts, and monitoring.',
      'Keep patient data off chain and document the privacy boundary clearly.',
      'Work with the security lead on threat models and incident response.',
    ],
    requirements: [
      'Experience deploying and maintaining smart contracts in production.',
      'Strong understanding of EVM chains, gas, and transaction reliability.',
      'Practical knowledge of hashing, signatures, and key management.',
      'Ability to reason about privacy, consent, and data minimization.',
      'Comfort with TypeScript or another backend language for integration work.',
    ],
    niceToHave: [
      'Experience with Base, Optimism, or another OP Stack chain.',
      'Audit experience or a security certification.',
      'Interest in health data, identity, or verifiable credentials.',
    ],
  },
  {
    slug: 'frontend-engineer-react',
    title: 'Frontend Engineer (React)',
    location: 'Remote',
    type: 'Full-time',
    team: 'Engineering',
    summary:
      'Make Selorah feel instant on low-bandwidth devices. You will own performance, accessibility, offline states, and the patient dashboard experience.',
    skills: ['React', 'TypeScript', 'Tailwind', 'PWA', 'Accessibility'],
    responsibilities: [
      'Build accessible, responsive interfaces for patients and care teams.',
      'Improve performance on low end devices and unstable networks.',
      'Own offline states, caching, and sync feedback across the app.',
      'Collaborate with design to turn prototypes into production components.',
      'Add tests and guardrails that keep the interface reliable as it grows.',
    ],
    requirements: [
      '3 or more years building React applications in production.',
      'Strong TypeScript, HTML, and CSS fundamentals.',
      'Experience with responsive design, accessibility, and browser performance.',
      'Comfort debugging across browsers and network conditions.',
      'A product mindset and clear communication in a remote team.',
    ],
    niceToHave: [
      'Experience with service workers, IndexedDB, or offline first apps.',
      'Experience with Tailwind CSS and design systems.',
      'Knowledge of Nigerian network and device constraints.',
    ],
  },
  {
    slug: 'devops-security-engineer',
    title: 'DevOps and Security Engineer',
    location: 'Remote',
    type: 'Full-time',
    team: 'Engineering',
    summary:
      'Keep patient data safe and the platform reliable. You will own infrastructure, monitoring, incident response, and compliance automation.',
    skills: ['Cloud infrastructure', 'CI/CD', 'Security', 'Observability'],
    responsibilities: [
      'Own deployment pipelines, environment configuration, and rollback safety.',
      'Harden authentication, secrets management, and access controls.',
      'Set up monitoring, alerting, and audit logs for critical services.',
      'Lead incident response and write clear post incident reviews.',
      'Support compliance work for data protection and health data handling.',
    ],
    requirements: [
      '3 or more years in DevOps, platform engineering, or security engineering.',
      'Experience with cloud infrastructure, containers, and CI/CD.',
      'Strong understanding of web security, identity, and secrets management.',
      'Experience with logging, metrics, and alerting in production.',
      'Calm judgment and clear writing during incidents.',
    ],
    niceToHave: [
      'Experience with Supabase, Vercel, or serverless platforms.',
      'Knowledge of NDPR, GDPR, or health data compliance.',
      'Experience with penetration testing or threat modeling.',
    ],
  },
];

export function getCareerRole(slug: string | undefined) {
  if (!slug) return undefined;
  return CAREER_ROLES.find((role) => role.slug === slug);
}

export function applyHref(role: string) {
  const subject = `Application: ${role}`;
  const body = [
    'Hello Selorah team,',
    '',
    `I would like to apply for the ${role} role.`,
    '',
    'A short introduction:',
    '',
    'Portfolio or GitHub:',
    'LinkedIn:',
    'Resume: attach it to this email.',
    '',
    'Thank you,',
  ].join('\n');
  return `mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
