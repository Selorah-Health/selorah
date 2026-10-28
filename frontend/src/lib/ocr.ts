type OcrProgress = (progress: number, status: string) => void;

type OcrResult = {
  data: {
    text: string;
    confidence?: number;
  };
};

type TesseractWorker = {
  setParameters: (params: Record<string, string>) => Promise<unknown>;
  recognize: (
    input: string | Blob,
    options?: Record<string, unknown>
  ) => Promise<OcrResult>;
  terminate: () => Promise<unknown>;
};

type TesseractModule = {
  createWorker: (
    lang: string,
    oem?: number,
    options?: {
      logger?: (message: { status: string; progress: number }) => void;
      cacheMethod?: 'write' | 'none' | 'refresh';
      workerPath?: string;
      corePath?: string;
      langPath?: string;
      gzip?: boolean;
    }
  ) => Promise<TesseractWorker>;
};

let workerPromise: Promise<TesseractWorker> | null = null;
let idleTimer: number | null = null;
let activeProgress: OcrProgress | null = null;

const MAX_OCR_DIMENSION = 2000;
const MIN_OCR_DIMENSION = 1400;
const OCR_IDLE_MS = 5 * 60 * 1000;
const OCR_ASSET_BASE = '/tesseract';

/**
 * Medical and report vocabulary used to repair common OCR mistakes.
 * Keeping the list focused avoids "correcting" patient names or addresses.
 */
const MEDICAL_WORDS = new Set(
  `haemoglobin hemoglobin haemoglobinopathy haematocrit hematocrit haemogram
  leukocyte leucocyte leukocytes leucocytes erythrocyte erythrocytes platelet platelets
  thrombocyte thrombocytes neutrophil neutrophils lymphocyte lymphocytes monocyte monocytes
  eosinophil eosinophils basophil basophils reticulocyte reticulocytes
  anaemia anemia anaemic anemic sickle thalassaemia thalassemia genotype phenotype
  malaria typhoid hepatitis tuberculosis hiv retroviral infection inflammation
  hypertension hypotension diabetes diabetic glucose glycosylated cholesterol lipid
  triglyceride creatinine urea electrolyte electrolytes sodium potassium chloride
  bicarbonate calcium magnesium phosphate albumin protein bilirubin alkaline phosphatase
  transaminase aspartate alanine amylase lipase lactate ferritin folate vitamin
  urinalysis microscopy culture sensitivity organism bacteria bacterial viral fungus
  parasitic parasite antibody antigen reactive nonreactive positive negative
  pregnancy pregnant gestation trimester antenatal postnatal obstetric gynaecology
  gynecology caesarean cesarean delivery miscarriage ovulation menstrual
  prescription prescribed medication medications dosage dose tablet tablets capsule
  capsules syrup suspension injection intravenous intramuscular subcutaneous
  paracetamol acetaminophen ibuprofen diclofenac amoxicillin ampicillin penicillin
  ceftriaxone ciprofloxacin metronidazole artemether lumefantrine insulin metformin
  losartan amlodipine lisinopril hydrochlorothiazide furosemide prednisolone
  diagnosis diagnoses diagnostic prognosis symptom symptoms syndrome disease disorder
  acute chronic severe mild moderate stable unstable critical normal abnormal
  laboratory lab labs pathology radiology imaging ultrasound scan xray x-ray
  computed tomography magnetic resonance mammography biopsy histology cytology
  specimen sample collected received reported verified approved reviewed
  physician doctor consultant specialist clinician nurse practitioner hospital clinic
  centre center ward theatre theater admission discharge outpatient inpatient
  emergency department pharmacy dispensary laboratory bloodbank blood bank
  patient patients name age sex gender male female date birth address phone
  history examination findings impression conclusion recommendation
  treatment management followup follow-up review referral results report
  reference range units value values level levels test tests profile panel
  fasting random morning afternoon evening night daily weekly monthly annual
  milligram milligrams gram grams microgram micrograms millilitre milliliters
  millilitre millilitres litre liters decilitre deciliters millimole millimoles
  micromole micromoles international unit units per litre liter deciliter
  weight height blood pressure pulse temperature respiration oxygen saturation
  bmi body mass index heart rate respiratory rate
  allergy allergies asthmatic asthma epilepsy seizure seizures stroke cardiac
  cardiovascular renal hepatic pulmonary respiratory gastrointestinal gastritis
  ulcer peptic pneumonia bronchitis tuberculosis meningitis sepsis septic shock
  dehydration diarrhoea diarrhea vomiting nausea fever cough headache fatigue
  dizziness chest pain abdominal pain back pain joint pain swelling edema oedema
  surgery surgical operation procedure incision wound fracture dislocation
  immunisation immunization vaccination vaccine vaccines booster
  genotype bloodgroup blood-group rhesus compatible compatibility transfusion
  haematuria hematuria proteinuria glycosuria ketonuria nitrite leukocyte
  hba1c pcv mcv mch mchc wbc rbc esr crp hbsag hcv vdrl widal
  malaria parasite density trophozoite gametocyte
  outpatient department opd accident emergency a&e icu nicu
  consultant registrar houseofficer house-officer matron midwife pharmacist
  lagos abuja nigeria nigerian africa african
  creatinine kinase troponin thyroxine thyroid testosterone progesterone oestrogen
  estrogen prolactin cortisol aldosterone renin gastrin
  endoscopy colonoscopy bronchoscopy dialysis chemotherapy radiotherapy
  oncology cardiology neurology dermatology paediatrics pediatrics psychiatry
  orthopaedics orthopedics ophthalmology otolaryngology urology nephrology
  hepatology gastroenterology endocrinology immunology haematology hematology
  microbiology parasitology virology serology biochemistry histopathology
  antenatal postnatal neonatal perinatal maternal infant paediatric pediatric
  symptoms signs complaints duration onset frequency severity radiation
  prescribed dispensed administered dosage frequency route
  capsule tablet syrup suspension suppository inhaler nebuliser nebulizer
  ointment cream drops infusion transfusion
  haemorrhage hemorrhage thrombosis embolism ischaemia ischemia infarction
  arrhythmia tachycardia bradycardia fibrillation palpitations
  hyperglycaemia hyperglycemia hypoglycaemia hypoglycemia
  hyperthyroidism hypothyroidism hyperkalaemia hypokalaemia
  hyponatraemia hypernatraemia dehydration
  cirrhosis fibrosis necrosis malignancy benign metastatic carcinoma sarcoma
  lymphoma leukaemia leukemia tumour tumor neoplasm
  hiv positive negative indeterminate viral load cd4
  hepatitis b c surface antigen core antibody
  covid coronavirus influenza pneumonia
  blood film genotype electrophoresis solubility sickle cell
  packed cell volume mean corpuscular volume mean corpuscular haemoglobin
  reticulocyte count platelet count white blood cell red blood cell
  differential neutrophil lymphocyte monocyte eosinophil basophil
  culture growth no growth organism isolated sensitive resistant
  urinalysis colour color appearance ph specific gravity protein glucose ketones
  blood nitrite leucocyte esterase microscopy pus cells epithelial cells casts
  crystals bacteria yeast
  stool occult blood ova cyst parasite
  semen analysis sperm count motility morphology
  pregnancy test beta hcg human chorionic gonadotropin
  blood sugar fasting random postprandial
  liver function kidney function renal function thyroid function lipid profile
  electrocardiogram electroencephalogram echocardiogram
  ct mri xray ultrasound scan mammogram densitometry
  informed consent confidentiality disclosure authorization
  nhis hmo insurance claim authorization code
  outpatient inpatient admission discharge summary referral letter
  medical certificate fitness fitness-to-work sick leave
  doctor's name signature stamp date time
  note notes comment comments impression conclusion recommendation plan`
    .split(/\s+/)
    .filter(Boolean)
);

const COMMON_WORDS = new Set(
  `the and for with from this that these those you your our their his her its
  are was were been being have has had will would can could should may might must
  not no yes all any some more most other into over under about after before
  than then there here when where what which who whom whose why how
  page of to in on at by as is it be or if do does did done
  please note notes total result results value values range reference
  hospital clinic laboratory patient doctor date time signature signed
  department unit sample report reports comment comments impression
  normal abnormal within high low positive negative tested test
  female male adult child children years months weeks days
  first second third final interim provisional repeat
  present absent seen noted observed detected found
  mild moderate severe slightly markedly significantly
  left right bilateral upper lower anterior posterior lateral medial
  increase increased decrease decreased elevated reduced
  within above below normal abnormal borderline indeterminate
  negative positive reactive non-reactive nonreactive
  screening diagnostic follow-up followup review
  collected received reported verified approved released
  morning afternoon evening night fasting random
  before after with without during
  tablet capsules daily twice thrice times
  once two three four five six seven eight nine ten
  one half quarter`
    .split(/\s+/)
    .filter(Boolean)
);

const CONFUSION_CHARS: Record<string, string> = {
  '0': 'o',
  '1': 'l',
  '5': 's',
  '8': 'b',
  '@': 'a',
  '|': 'l',
  '!': 'i',
  $: 's',
  '€': 'e',
};

function isKnownWord(value: string) {
  const lower = value.toLowerCase();
  return MEDICAL_WORDS.has(lower) || COMMON_WORDS.has(lower);
}

function matchCase(original: string, replacement: string) {
  if (!original) return replacement;
  if (original === original.toUpperCase()) return replacement.toUpperCase();
  if (original[0] === original[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function withinOneEdit(left: string, right: string) {
  if (Math.abs(left.length - right.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;

  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (left.length > right.length) {
      i += 1;
    } else if (left.length < right.length) {
      j += 1;
    } else {
      i += 1;
      j += 1;
    }
  }

  return edits + (left.length - i) + (right.length - j) <= 1;
}

function closestWord(token: string, dictionary: Set<string>) {
  const lower = token.toLowerCase();
  if (lower.length < 4) return null;

  let match: string | null = null;
  for (const word of dictionary) {
    if (Math.abs(word.length - lower.length) > 1) continue;
    if (!withinOneEdit(lower, word)) continue;
    if (match) return null;
    match = word;
  }
  return match;
}

function splitAffixes(token: string) {
  const match = token.match(/^([^A-Za-z0-9]*)([A-Za-z0-9'/-]+)([^A-Za-z0-9]*)$/);
  if (!match) return { leading: '', core: token, trailing: '' };
  return { leading: match[1], core: match[2], trailing: match[3] };
}

function repairToken(token: string) {
  if (!token || token.length < 3) return token;

  const { leading, core, trailing } = splitAffixes(token);
  if (!core || isKnownWord(core)) return token;

  // Never rewrite long identifiers, dates, or values.
  if (/\d/.test(core) && !isKnownWord(core)) return token;
  if (core.length > 22) return token;

  const replaced = core.replace(
    /[0158@|!$€]/g,
    (character) => CONFUSION_CHARS[character] || character
  );

  if (replaced !== core && isKnownWord(replaced)) {
    return `${leading}${matchCase(core, replaced)}${trailing}`;
  }

  if (/^[A-Z]{2,5}$/.test(core) && !isKnownWord(core)) {
    return token;
  }

  const medical = closestWord(replaced, MEDICAL_WORDS);
  if (medical) return `${leading}${matchCase(core, medical)}${trailing}`;

  const common = closestWord(replaced, COMMON_WORDS);
  if (common) return `${leading}${matchCase(core, common)}${trailing}`;

  return token;
}

function repairUnits(text: string) {
  return text
    .replace(/\bmg\s*\/\s*dl\b/gi, 'mg/dL')
    .replace(/\bg\s*\/\s*dl\b/gi, 'g/dL')
    .replace(/\bmmol\s*\/\s*l\b/gi, 'mmol/L')
    .replace(/\bµmol\s*\/\s*l\b/gi, 'µmol/L')
    .replace(/\bumol\s*\/\s*l\b/gi, 'µmol/L')
    .replace(/\bmm\s*hg\b/gi, 'mmHg')
    .replace(/\bmm\s*\/\s*hr\b/gi, 'mm/hr')
    .replace(/\bx\s*10\s*([³3])\s*\/\s*[µu]l\b/gi, 'x10³/µL')
    .replace(/\b10\s*\^\s*([³3])\s*\/\s*[µu]l\b/gi, 'x10³/µL')
    .replace(/(\d)\s*%/g, '$1%')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/([,.;:])(?=[A-Za-z0-9])/g, '$1 ');
}

/**
 * Clean raw OCR output and repair obvious misreads.
 * The result is always editable, so a wrong correction cannot silently change
 * the saved document without the patient seeing it first.
 */
export function correctOcrText(raw: string) {
  if (!raw) return '';

  const merged = raw
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/([A-Za-z])-\n\s*([A-Za-z])/g, '$1$2')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  const repaired = merged
    .split('\n')
    .map((line) =>
      line
        .split(/(\s+)/)
        .map((part) => (/^\s+$/.test(part) ? part : repairToken(part)))
        .join('')
    )
    .join('\n');

  return repairUnits(repaired).trim();
}

async function createWorkerInstance(module: TesseractModule) {
  return module.createWorker('eng', 1, {
    workerPath: `${OCR_ASSET_BASE}/worker.min.js`,
    corePath: OCR_ASSET_BASE,
    langPath: `${OCR_ASSET_BASE}/lang`,
    cacheMethod: 'write',
    gzip: true,
    logger: (message) => {
      if (typeof message.progress !== 'number') return;
      activeProgress?.(message.progress, message.status);
    },
  });
}

async function loadWorker(onProgress?: OcrProgress): Promise<TesseractWorker> {
  activeProgress = onProgress || null;
  if (workerPromise) return workerPromise;

  workerPromise = (async () => {
    const module = (await import('tesseract.js')) as unknown as TesseractModule;

    let worker: TesseractWorker;
    try {
      worker = await createWorkerInstance(module);
    } catch {
      // The local engine assets are the fast path. If a deployment is missing
      // them, fall back to the official CDN instead of failing the scan.
      worker = await module.createWorker('eng', 1, {
        cacheMethod: 'write',
        logger: (message) => {
          if (typeof message.progress !== 'number') return;
          activeProgress?.(message.progress, message.status);
        },
      });
    }

    await worker.setParameters({
      tessedit_pageseg_mode: '3',
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
      tessedit_do_invert: '0',
    });

    return worker;
  })();

  return workerPromise;
}

/**
 * Warm the worker and language data before the patient chooses a file.
 * This hides most of the first-run download behind the capture UI.
 */
export async function prewarmOcr() {
  if (typeof window === 'undefined') return;
  try {
    await loadWorker();
  } catch {
    // OCR is optional. The record can still be saved without extracted text.
  }
}

async function imageFrom(source: string | Blob): Promise<HTMLImageElement | ImageBitmap> {
  if (typeof source === 'string') {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Could not open that image.'));
      image.src = source;
    });
  }

  if ('createImageBitmap' in window) {
    return await createImageBitmap(source);
  }

  const url = URL.createObjectURL(source);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Could not open that image.'));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function contrastStretch(data: Uint8ClampedArray) {
  const histogram = new Uint32Array(256);
  for (let index = 0; index < data.length; index += 4) {
    const gray = Math.round(
      0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2]
    );
    data[index] = gray;
    histogram[gray] += 1;
  }

  const total = data.length / 4;
  const lowTarget = total * 0.002;
  const highTarget = total * 0.998;
  let running = 0;
  let low = 0;
  let high = 255;

  for (let value = 0; value < 256; value += 1) {
    running += histogram[value];
    if (running >= lowTarget) {
      low = value;
      break;
    }
  }

  running = 0;
  for (let value = 0; value < 256; value += 1) {
    running += histogram[value];
    if (running >= highTarget) {
      high = value;
      break;
    }
  }

  const span = Math.max(1, high - low);
  for (let index = 0; index < data.length; index += 4) {
    const stretched = Math.max(0, Math.min(255, ((data[index] - low) / span) * 255));
    data[index] = stretched;
    data[index + 1] = stretched;
    data[index + 2] = stretched;
  }
}

function otsuThreshold(data: Uint8ClampedArray) {
  const histogram = new Uint32Array(256);
  const total = data.length / 4;
  for (let index = 0; index < data.length; index += 4) {
    histogram[data[index]] += 1;
  }

  let sum = 0;
  for (let value = 0; value < 256; value += 1) sum += value * histogram[value];

  let sumBackground = 0;
  let weightBackground = 0;
  let maxVariance = 0;
  let threshold = 160;

  for (let value = 0; value < 256; value += 1) {
    weightBackground += histogram[value];
    if (!weightBackground) continue;
    const weightForeground = total - weightBackground;
    if (!weightForeground) break;

    sumBackground += value * histogram[value];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sum - sumBackground) / weightForeground;
    const variance =
      weightBackground *
      weightForeground *
      (meanBackground - meanForeground) *
      (meanBackground - meanForeground);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = value;
    }
  }

  return threshold;
}

async function prepareForOcr(
  source: string | Blob,
  mode: 'normal' | 'binary' = 'normal'
): Promise<Blob> {
  const image = await imageFrom(source);
  const sourceWidth = 'width' in image ? image.width : 0;
  const sourceHeight = 'height' in image ? image.height : 0;
  if (!sourceWidth || !sourceHeight) throw new Error('That image has no readable size.');

  const longest = Math.max(sourceWidth, sourceHeight);
  let scale = Math.min(1, MAX_OCR_DIMENSION / longest);
  if (longest < MIN_OCR_DIMENSION) {
    scale = Math.min(2.2, MIN_OCR_DIMENSION / longest);
  }

  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const padding = Math.round(Math.min(width, height) * 0.015);

  const canvas = document.createElement('canvas');
  canvas.width = width + padding * 2;
  canvas.height = height + padding * 2;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Image processing is unavailable on this browser.');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image as CanvasImageSource, padding, padding, width, height);

  if ('close' in image && typeof image.close === 'function') image.close();

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = pixels.data;
  contrastStretch(data);

  if (mode === 'binary') {
    const threshold = otsuThreshold(data);
    for (let index = 0; index < data.length; index += 4) {
      const value = data[index] >= threshold ? 255 : 0;
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value;
    }
  }

  context.putImageData(pixels, 0, 0);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not prepare the image.'))),
      'image/png'
    );
  });
}

function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Read text from a medical document image. The worker stays warm between scans
 * so a second document is much faster than the first.
 *
 * A normal pass handles most scans. If it returns almost nothing, a second
 * high-contrast pass is attempted automatically so faint or shadowed pages are
 * not silently saved as empty text.
 */
export async function extractTextFromImage(
  image: string | Blob,
  onProgress?: OcrProgress
): Promise<string> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Text recognition needs a connection the first time it runs.');
  }

  activeProgress = onProgress || null;
  const prepared = await prepareForOcr(image, 'normal');
  const worker = await loadWorker(onProgress);

  try {
    onProgress?.(0.05, 'recognizing text');
    const result = await worker.recognize(prepared, { rotateAuto: true });
    const firstText = correctOcrText(String(result?.data?.text || ''));
    const confidence = Number(result?.data?.confidence || 0);

    if (wordCount(firstText) >= 8 && confidence >= 40) {
      return firstText;
    }

    // Second pass for faint, shadowed, or low-contrast documents.
    onProgress?.(0.72, 'recognizing text');
    const binary = await prepareForOcr(image, 'binary');
    const second = await worker.recognize(binary, {
      rotateAuto: true,
      tessedit_pageseg_mode: '6',
    });
    const secondText = correctOcrText(String(second?.data?.text || ''));

    return wordCount(secondText) > wordCount(firstText) ? secondText : firstText;
  } finally {
    activeProgress = null;
    if (idleTimer) window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      void resetOcrWorker();
    }, OCR_IDLE_MS);
  }
}

export function resetOcrWorker() {
  if (typeof window !== 'undefined' && idleTimer) {
    window.clearTimeout(idleTimer);
    idleTimer = null;
  }
  const current = workerPromise;
  workerPromise = null;
  void current?.then((worker) => worker.terminate()).catch(() => undefined);
}
