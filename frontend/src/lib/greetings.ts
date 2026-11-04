const CHRISTIAN_NAMES = new Set([
  'samuel',
  'daniel',
  'david',
  'michael',
  'gabriel',
  'emmanuel',
  'immanuel',
  'john',
  'james',
  'peter',
  'paul',
  'matthew',
  'mark',
  'luke',
  'joseph',
  'mary',
  'grace',
  'faith',
  'hope',
  'blessing',
  'chinedu',
  'chiamaka',
  'nnamdi',
  'obinna',
  'ifeanyi',
  'chinonso',
  'ada',
  'amarachi',
  'uchenna',
  'onyeka',
  'kenechukwu',
  'chisom',
  'ekene',
  'gbenga',
  'adebayo',
  'oluwaseun',
  'temitope',
  'tunde',
  'bisi',
  'funke',
  'ngozi',
  'chioma',
  'kelechi',
  'somto',
  'victor',
  'victoria',
  'anthony',
  'patrick',
  'stephen',
  'philip',
  'andrew',
  'thomas',
  'simon',
  'timothy',
  'isaac',
  'abraham',
  'elijah',
  'elizabeth',
  'rebecca',
  'hannah',
  'ruth',
  'naomi',
  'priscilla',
  'dorcas',
  'lydia',
  'esther',
  'caleb',
  'joshua',
  'jeremiah',
  'isaiah',
  'ezekiel',
]);

const MUSLIM_NAMES = new Set([
  'mohammed',
  'muhammad',
  'mohamed',
  'musa',
  'ibrahim',
  'abdul',
  'abdullah',
  'abdullahi',
  'abdulrahman',
  'abdurrahman',
  'aisha',
  'fatima',
  'fatimah',
  'zainab',
  'amina',
  'halima',
  'yusuf',
  'yusufu',
  'ismail',
  'hassan',
  'hussein',
  'husain',
  'bilal',
  'umar',
  'usman',
  'sadiq',
  'sani',
  'aliyu',
  'ali',
  'suleiman',
  'sulaiman',
  'khadija',
  'khadijah',
  'maryam',
  'hauwa',
  'hafsat',
  'ramatu',
  'rakiya',
  'safiya',
  'zeenat',
  'nasir',
  'bashir',
  'garba',
  'idris',
  'kabir',
  'lawan',
  'mamman',
  'mukhtar',
  'mustapha',
  'nuhu',
  'saleh',
  'salihu',
  'shehu',
  'yakubu',
  'zakariya',
  'aminu',
  'bello',
  'dahiru',
  'hamza',
  'haruna',
  'jibril',
  'mahmud',
  'nasiru',
  'rufai',
  'shafiu',
  'tijani',
  'umaru',
  'usaini',
]);

const HINDU_NAMES = new Set([
  'arjun',
  'aarav',
  'vivaan',
  'aditya',
  'rohan',
  'rahul',
  'priya',
  'ananya',
  'aadhya',
  'diya',
  'krishna',
  'shiva',
  'ganesh',
  'lakshmi',
  'radha',
  'sita',
  'amit',
  'raj',
  'sanjay',
  'neha',
  'pooja',
  'puja',
  'kavya',
  'ishaan',
  'kabir',
  'varun',
  'vikram',
  'deepak',
  'sunita',
  'anjali',
  'meera',
  'nikhil',
  'pranav',
  'sameer',
  'tara',
]);

const JEWISH_NAMES = new Set([
  'moshe',
  'shlomo',
  'rivka',
  'yael',
  'noa',
  'ezra',
  'miriam',
  'levi',
  'cohen',
  'mendel',
  'chaim',
  'dov',
  'avi',
  'aviram',
  'eliana',
  'shira',
  'tamar',
  'yitzhak',
  'yaakov',
  'chana',
  'leah',
  'zvi',
]);

type Faith = 'christian' | 'muslim' | 'hindu' | 'jewish' | null;

type IslamicYear = {
  ramadan: [number, number];
  eidFitr: [number, number];
  eidAdha: [number, number];
  newYear: [number, number];
  ashura: [number, number];
  mawlid: [number, number];
};

type HinduYear = {
  holi: [number, number];
  diwali: [number, number];
};

type JewishYear = {
  roshHashanah: [number, number];
  yomKippur: [number, number];
  hanukkah: [number, number];
  passover: [number, number];
};

const ISLAMIC_DAYS: Record<number, IslamicYear> = {
  2025: {
    ramadan: [3, 1],
    eidFitr: [3, 30],
    eidAdha: [6, 6],
    newYear: [6, 26],
    ashura: [7, 5],
    mawlid: [9, 4],
  },
  2026: {
    ramadan: [2, 18],
    eidFitr: [3, 20],
    eidAdha: [5, 27],
    newYear: [6, 16],
    ashura: [6, 25],
    mawlid: [8, 25],
  },
  2027: {
    ramadan: [2, 8],
    eidFitr: [3, 9],
    eidAdha: [5, 16],
    newYear: [6, 6],
    ashura: [6, 15],
    mawlid: [8, 14],
  },
  2028: {
    ramadan: [1, 28],
    eidFitr: [2, 26],
    eidAdha: [5, 5],
    newYear: [5, 25],
    ashura: [6, 3],
    mawlid: [8, 3],
  },
};

const HINDU_DAYS: Record<number, HinduYear> = {
  2025: { holi: [3, 14], diwali: [10, 20] },
  2026: { holi: [3, 4], diwali: [11, 8] },
  2027: { holi: [3, 22], diwali: [10, 29] },
  2028: { holi: [3, 11], diwali: [10, 17] },
};

const JEWISH_DAYS: Record<number, JewishYear> = {
  2025: {
    roshHashanah: [9, 23],
    yomKippur: [10, 2],
    hanukkah: [12, 15],
    passover: [4, 13],
  },
  2026: {
    roshHashanah: [9, 12],
    yomKippur: [9, 21],
    hanukkah: [12, 5],
    passover: [4, 2],
  },
  2027: {
    roshHashanah: [10, 2],
    yomKippur: [10, 11],
    hanukkah: [12, 25],
    passover: [4, 22],
  },
  2028: {
    roshHashanah: [9, 21],
    yomKippur: [9, 30],
    hanukkah: [12, 13],
    passover: [4, 11],
  },
};

type MedicalDay = {
  month: number;
  day: number;
  endDay?: number;
  gender?: 'female' | 'male';
  text: string;
};

const MEDICAL_DAYS: MedicalDay[] = [
  {
    month: 2,
    day: 4,
    text: 'Today is World Cancer Day, {name}. Early checks save lives.',
  },
  {
    month: 3,
    day: 8,
    gender: 'female',
    text: 'Happy International Women\'s Day, {name}. Your health matters every day.',
  },
  {
    month: 3,
    day: 20,
    text: 'It is World Oral Health Day, {name}. A good day to book that dental check.',
  },
  {
    month: 3,
    day: 24,
    text: 'Today is World TB Day, {name}. Testing and treatment save lives.',
  },
  {
    month: 4,
    day: 7,
    text: 'Happy World Health Day, {name}. Your health is your greatest asset.',
  },
  {
    month: 4,
    day: 11,
    text: 'It is World Parkinson\'s Day, {name}. Support and understanding matter.',
  },
  {
    month: 5,
    day: 5,
    text: 'It is World Hand Hygiene Day, {name}. Clean hands protect lives.',
  },
  {
    month: 5,
    day: 12,
    text: 'Today we celebrate nurses, {name}. Thank you to every nurse who cares for others.',
  },
  {
    month: 5,
    day: 17,
    text: 'It is World Hypertension Day, {name}. Know your blood pressure.',
  },
  {
    month: 5,
    day: 31,
    text: 'Today is World No Tobacco Day, {name}. Quitting is one of the best gifts you can give your health.',
  },
  {
    month: 6,
    day: 14,
    text: 'It is World Blood Donor Day, {name}. One donation can save up to three lives.',
  },
  {
    month: 6,
    day: 19,
    text: 'Today is World Sickle Cell Day, {name}. Know your genotype and support those who live with it.',
  },
  {
    month: 7,
    day: 28,
    text: 'Today is World Hepatitis Day, {name}. Testing and treatment matter.',
  },
  {
    month: 8,
    day: 1,
    endDay: 7,
    text: 'It is World Breastfeeding Week, {name}. Support makes a difference.',
  },
  {
    month: 9,
    day: 8,
    text: 'It is World Physical Therapy Day, {name}. Movement is medicine.',
  },
  {
    month: 9,
    day: 10,
    text: 'Today is World Suicide Prevention Day, {name}. Reaching out can save a life.',
  },
  {
    month: 9,
    day: 13,
    text: 'It is World First Aid Day, {name}. A little training can save a life.',
  },
  {
    month: 9,
    day: 17,
    text: 'Today is World Patient Safety Day, {name}. Safe care starts with speaking up.',
  },
  {
    month: 9,
    day: 21,
    text: 'It is World Alzheimer\'s Day, {name}. Early support matters.',
  },
  {
    month: 9,
    day: 25,
    text: 'Today we celebrate pharmacists, {name}. Thank you for keeping medicines safe.',
  },
  {
    month: 9,
    day: 29,
    text: 'It is World Heart Day, {name}. A gentle reminder to care for your heart.',
  },
  {
    month: 10,
    day: 10,
    text: 'It is World Mental Health Day, {name}. It is okay to pause and ask for support.',
  },
  {
    month: 10,
    day: 20,
    text: 'It is World Osteoporosis Day, {name}. Strong bones start with movement and nutrition.',
  },
  {
    month: 10,
    day: 29,
    text: 'It is World Stroke Day, {name}. Acting fast can save a life.',
  },
  {
    month: 11,
    day: 12,
    text: 'Today is World Pneumonia Day, {name}. Prevention and early care save lives.',
  },
  {
    month: 11,
    day: 14,
    text: 'Today is World Diabetes Day, {name}. Know your numbers.',
  },
  {
    month: 11,
    day: 17,
    text: 'It is World Prematurity Day, {name}. Every small life deserves big care.',
  },
  {
    month: 11,
    day: 19,
    gender: 'male',
    text: 'Happy International Men\'s Day, {name}. Your health matters.',
  },
  {
    month: 12,
    day: 1,
    text: 'Today is World AIDS Day, {name}. Testing and compassion matter.',
  },
  {
    month: 12,
    day: 3,
    text: 'Today is the International Day of Persons with Disabilities, {name}. Inclusion matters.',
  },
];

function inSet(set: Set<string>, name: string) {
  const tokens = name.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (!tokens.length) return false;
  if (set.has(tokens[0])) return true;
  return tokens.some((token) => set.has(token));
}

function inferFaith(name: string): Faith {
  if (!name || name === 'there') return null;
  if (inSet(MUSLIM_NAMES, name)) return 'muslim';
  if (inSet(CHRISTIAN_NAMES, name)) return 'christian';
  if (inSet(HINDU_NAMES, name)) return 'hindu';
  if (inSet(JEWISH_NAMES, name)) return 'jewish';
  return null;
}

function isDay(now: Date, month: number, day: number) {
  return now.getMonth() === month - 1 && now.getDate() === day;
}

function inRange(now: Date, month: number, day: number, endDay: number) {
  return now.getMonth() === month - 1 && now.getDate() >= day && now.getDate() <= endDay;
}

function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function shiftDay(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function religiousGreeting(faith: Faith, name: string, now: Date) {
  if (!faith) return null;
  const year = now.getFullYear();

  if (faith === 'christian') {
    if (isDay(now, 12, 24) || isDay(now, 12, 25)) return `Merry Christmas, ${name}!`;
    if (isDay(now, 12, 26)) return `Happy Boxing Day, ${name}!`;
    if (isDay(now, 1, 6)) return `Happy Epiphany, ${name}!`;

    const easter = easterSunday(year);
    if (isDay(now, easter.getMonth() + 1, easter.getDate())) {
      return `Happy Easter, ${name}!`;
    }
    const goodFriday = shiftDay(easter, -2);
    if (isDay(now, goodFriday.getMonth() + 1, goodFriday.getDate())) {
      return `Good Friday, ${name}. May the day bring you peace.`;
    }
    const easterMonday = shiftDay(easter, 1);
    if (isDay(now, easterMonday.getMonth() + 1, easterMonday.getDate())) {
      return `Happy Easter Monday, ${name}!`;
    }
    return null;
  }

  if (faith === 'muslim') {
    const dates = ISLAMIC_DAYS[year];
    if (!dates) return null;
    if (isDay(now, ...dates.eidFitr)) return `Eid Mubarak, ${name}!`;
    if (isDay(now, ...dates.eidAdha)) return `Eid Mubarak, ${name}!`;
    if (isDay(now, ...dates.ramadan)) return `Ramadan Mubarak, ${name}!`;
    if (isDay(now, ...dates.mawlid)) return `Mawlid Mubarak, ${name}!`;
    if (isDay(now, ...dates.newYear)) return `Happy Islamic New Year, ${name}!`;
    if (isDay(now, ...dates.ashura)) return `Ashura Mubarak, ${name}!`;
    return null;
  }

  if (faith === 'hindu') {
    const dates = HINDU_DAYS[year];
    if (!dates) return null;
    if (isDay(now, ...dates.holi)) return `Happy Holi, ${name}!`;
    if (isDay(now, ...dates.diwali)) return `Happy Diwali, ${name}!`;
    return null;
  }

  if (faith === 'jewish') {
    const dates = JEWISH_DAYS[year];
    if (!dates) return null;
    if (isDay(now, ...dates.roshHashanah)) return `Shanah Tovah, ${name}!`;
    if (isDay(now, ...dates.yomKippur)) {
      return `May you have a meaningful Yom Kippur, ${name}.`;
    }
    if (inRange(now, dates.hanukkah[0], dates.hanukkah[1], dates.hanukkah[1] + 7)) {
      return `Happy Hanukkah, ${name}!`;
    }
    if (isDay(now, ...dates.passover)) return `Happy Passover, ${name}!`;
    return null;
  }

  return null;
}

function medicalGreeting(name: string, gender: string, now: Date) {
  const normalized = (gender || '').toLowerCase();
  const isFemale = /^f/.test(normalized);
  const isMale = /^m/.test(normalized);

  for (const entry of MEDICAL_DAYS) {
    if (entry.gender === 'female' && !isFemale) continue;
    if (entry.gender === 'male' && !isMale) continue;
    const matches = entry.endDay
      ? inRange(now, entry.month, entry.day, entry.endDay)
      : isDay(now, entry.month, entry.day);
    if (matches) return entry.text.replace('{name}', name);
  }

  return null;
}

function seasonalGreeting(name: string, now: Date) {
  if (now.getMonth() === 0 && now.getDate() <= 5) return `Happy New Year, ${name}!`;
  if (isDay(now, 2, 14)) return `Happy Valentine's Day, ${name}!`;
  if (now.getMonth() === 11 && now.getDate() >= 24 && now.getDate() <= 26) {
    return `Happy holidays, ${name}!`;
  }
  return null;
}

function timeOfDayGreeting(name: string, gender: string, now: Date) {
  const hour = now.getHours();
  const isFemale = /^f/i.test(gender);
  const fallback = isFemale ? 'queen' : 'champ';
  const display = name && name !== 'there' ? name : fallback;

  const morning = [
    `Beautiful morning, ${display}`,
    `Arise and shine, ${display}!`,
    `A fresh start today, ${display}`,
    `Rise and thrive, ${display}`,
  ];
  const afternoon = [
    `Good afternoon, ${display}`,
    `Hope your day is going well, ${display}`,
    `What would you like to do today, ${display}?`,
    `Welcome back, ${display}!`,
  ];
  const evening = [
    `Good evening, ${display}`,
    `Welcome back, ${display}!`,
    `You made it through today, ${display}`,
    `Time to unwind, ${display}`,
  ];

  const list = hour < 12 ? morning : hour < 17 ? afternoon : evening;
  const seed = now.getDate() + display.length + (isFemale ? 1 : 0);
  return list[seed % list.length];
}

/**
 * Returns a greeting for the current day, or a friendly time-of-day greeting.
 * Religious greetings are only used when the first name is a clear match, so
 * the dashboard never assigns a faith to someone who has not indicated one.
 */
export function getGreeting(rawName: string, gender: string, now = new Date()) {
  const name = rawName?.trim() && rawName.trim() !== 'there' ? rawName.trim() : '';
  const display = name || (/^f/i.test(gender) ? 'queen' : 'champ');
  const faith = inferFaith(name);

  if (now.getMonth() === 0 && now.getDate() <= 5) {
    return `Happy New Year, ${display}!`;
  }

  const religious = religiousGreeting(faith, display, now);
  if (religious) return religious;

  const medical = medicalGreeting(display, gender, now);
  if (medical) return medical;

  const seasonal = seasonalGreeting(display, now);
  if (seasonal) return seasonal;

  if (now.getDate() <= 3) {
    return `Happy new month, ${display}!`;
  }

  return timeOfDayGreeting(display, gender, now);
}
