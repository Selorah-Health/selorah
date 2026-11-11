import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  ShieldCheckIcon,
  StopIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';
import { readLocalSession } from '../lib/auth/session';
import { isOffline } from '../lib/offlineSnapshot';
import { useToast } from '../contexts/ToastContext';
import { useAsyncAction } from '../lib/asyncState';
import { confirmDialog } from '../lib/dialogs';
import {
  isPermissionDeniedError,
  showPermissionHelp,
  usePermissionState,
} from '../lib/permissions';

const BUCKET = 'emergency-attachments';
const EMERGENCY_NUMBER = '112';

const TYPES = [
  { id: 'medical', label: 'Medical emergency' },
  { id: 'accident', label: 'Accident or injury' },
  { id: 'pregnancy', label: 'Pregnancy emergency' },
  { id: 'mental-health', label: 'Mental health crisis' },
  { id: 'other', label: 'Other emergency' },
];

type Coordinates = { lat: number; lon: number };

type Hospital = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
  phone: string;
  address: string;
};

type OverpassElement = {
  type?: string;
  id?: number | string;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

type SavedReport = {
  id: string;
  reference: string;
  emergency_type: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  location_label: string;
  nearest_hospital: Hospital[];
  photo_url: string | null;
  voice_url: string | null;
  status: string;
  created_at: string;
  synced: boolean;
};

function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `emergency-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function extensionFor(file: File | Blob, fallback: string) {
  const type = file.type || '';
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  if (type.includes('mp4')) return 'm4a';
  if (type.includes('mpeg')) return 'mp3';
  if (type.includes('ogg')) return 'ogg';
  if (type.includes('wav')) return 'wav';
  if (type.includes('webm')) return 'webm';
  return fallback;
}

const AUDIO_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

function preferredAudioMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  if (typeof MediaRecorder.isTypeSupported !== 'function') return '';

  const audio = document.createElement('audio');
  const supported = AUDIO_MIME_CANDIDATES.filter((type) => MediaRecorder.isTypeSupported(type));
  return supported.find((type) => audio.canPlayType(type) !== '') || supported[0] || '';
}

function haversineKm(a: Coordinates, b: Coordinates) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earth = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(h));
}

function readReports(key: string): SavedReport[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (report): report is SavedReport =>
        Boolean(report) && typeof report.id === 'string' && typeof report.reference === 'string',
    );
  } catch {
    return [];
  }
}

function writeReports(key: string, reports: SavedReport[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(reports));
  } catch {
    // The current session still works when storage is blocked.
  }
}

const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

type EmergencyDraft = {
  emergencyType: string;
  description: string;
  locationLabel: string;
  location: Coordinates | null;
  manualLat: string;
  manualLon: string;
  manualOpen: boolean;
  hospitals: Hospital[];
  savedAt: number;
};

function draftKeyFor(userId: string) {
  return `selorah_emergency_draft_${userId}`;
}

/**
 * The service worker reloads the page once after a silent update. Saving the
 * draft here means an update, a crash, or a backgrounded PWA never loses the
 * location the patient already shared.
 */
function readDraft(key: string): EmergencyDraft | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<EmergencyDraft> | null;
    if (!parsed || typeof parsed.savedAt !== 'number') return null;

    if (Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
      window.localStorage.removeItem(key);
      return null;
    }

    const location = parsed.location;
    const validLocation =
      location &&
      Number.isFinite(location.lat) &&
      Number.isFinite(location.lon)
        ? { lat: location.lat, lon: location.lon }
        : null;

    const hospitals = Array.isArray(parsed.hospitals)
      ? parsed.hospitals.filter(
          (hospital): hospital is Hospital =>
            Boolean(hospital) &&
            typeof hospital.id === 'string' &&
            typeof hospital.name === 'string' &&
            Number.isFinite(hospital.lat) &&
            Number.isFinite(hospital.lon) &&
            Number.isFinite(hospital.distanceKm),
        )
      : [];

    const emergencyType =
      typeof parsed.emergencyType === 'string' &&
      TYPES.some((type) => type.id === parsed.emergencyType)
        ? parsed.emergencyType
        : 'medical';

    return {
      emergencyType,
      description: typeof parsed.description === 'string' ? parsed.description : '',
      locationLabel:
        typeof parsed.locationLabel === 'string' ? parsed.locationLabel : '',
      location: validLocation,
      manualLat: typeof parsed.manualLat === 'string' ? parsed.manualLat : '',
      manualLon: typeof parsed.manualLon === 'string' ? parsed.manualLon : '',
      manualOpen: Boolean(parsed.manualOpen),
      hospitals,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

function writeDraft(key: string, draft: EmergencyDraft | null) {
  try {
    if (!draft) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Storage can be blocked in private mode.
  }
}

const LAST_LOCATION_KEY = 'selorah_last_location';
const LAST_LOCATION_TTL_MS = 24 * 60 * 60 * 1000;

type LastKnownLocation = {
  lat: number;
  lon: number;
  label: string;
  savedAt: number;
};

function readLastLocation(): LastKnownLocation | null {
  try {
    const raw = window.localStorage.getItem(LAST_LOCATION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<LastKnownLocation> | null;
    if (
      !parsed ||
      !Number.isFinite(parsed.lat) ||
      !Number.isFinite(parsed.lon) ||
      typeof parsed.savedAt !== 'number'
    ) {
      return null;
    }

    if (Date.now() - parsed.savedAt > LAST_LOCATION_TTL_MS) {
      window.localStorage.removeItem(LAST_LOCATION_KEY);
      return null;
    }

    return {
      lat: parsed.lat as number,
      lon: parsed.lon as number,
      label: typeof parsed.label === 'string' ? parsed.label : 'Last known location',
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

function writeLastLocation(next: Coordinates, label: string) {
  const saved: LastKnownLocation = {
    lat: next.lat,
    lon: next.lon,
    label: label.trim() || 'Current location',
    savedAt: Date.now(),
  };

  try {
    window.localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(saved));
  } catch {
    // Storage can be blocked in private mode.
  }

  return saved;
}

function formatLastKnownTime(savedAt: number) {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return 'recently';

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getPosition(options: PositionOptions): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        }),
      (error) => reject(error),
      options,
    );
  });
}

/**
 * GPS can be slow or unavailable indoors. Try a fast network or cached fix
 * first, then a high accuracy fix. The old single high accuracy request with
 * maximumAge 0 was the main reason patients were asked for coordinates.
 */
async function getCurrentCoordinates(): Promise<Coordinates> {
  if (!navigator.geolocation) {
    throw new Error('Location is not available in this browser.');
  }

  const attempts: PositionOptions[] = [
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
  ];

  let lastError: unknown = new Error('Could not get your location.');

  for (const options of attempts) {
    try {
      return await getPosition(options);
    } catch (error) {
      lastError = error;
      if (isPermissionDeniedError(error)) throw error;
    }
  }

  throw lastError;
}

type GeocodedPlace = {
  lat: number;
  lon: number;
  label: string;
};

/**
 * A landmark fallback for patients who cannot remember coordinates. Nominatim
 * is the public OpenStreetMap geocoder and is only called when the patient
 * explicitly searches for a place.
 */
async function geocodePlace(query: string): Promise<GeocodedPlace> {
  const trimmed = query.trim();
  if (trimmed.length < 3) {
    throw new Error('Type a street, estate, or landmark.');
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', trimmed);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '0');

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Place search is unavailable. Try again or use your location.');
  }

  const data = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
  }>;
  const first = data[0];
  if (!first) {
    throw new Error('No place was found. Try a nearby landmark.');
  }

  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error('No place was found. Try a nearby landmark.');
  }

  return {
    lat,
    lon,
    label: first.display_name || trimmed,
  };
}

async function findHospitals(around: Coordinates): Promise<Hospital[]> {
  const query = `[out:json][timeout:25];
(
  node["amenity"="hospital"](around:15000,${around.lat},${around.lon});
  way["amenity"="hospital"](around:15000,${around.lat},${around.lon});
  relation["amenity"="hospital"](around:15000,${around.lat},${around.lon});
);
out center tags;`;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  let data: OverpassResponse | null = null;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!response.ok) continue;
      data = await response.json();
      break;
    } catch {
      // Try the next mirror.
    }
  }

  if (!data) throw new Error('Hospital lookup is unavailable right now.');

  const elements = Array.isArray(data.elements) ? data.elements : [];
  const hospitals: Hospital[] = [];

  for (const element of elements) {
    const lat = Number(element.lat ?? element.center?.lat);
    const lon = Number(element.lon ?? element.center?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const tags = element.tags || {};
    const address =
      tags['addr:full'] ||
      [
        tags['addr:housenumber'],
        tags['addr:street'],
        tags['addr:city'],
        tags['addr:state'],
      ]
        .filter(Boolean)
        .join(', ');

    hospitals.push({
      id: `${element.type || 'hospital'}/${element.id || `${lat},${lon}`}`,
      name: tags.name || tags['name:en'] || 'Hospital',
      lat,
      lon,
      distanceKm: haversineKm(around, { lat, lon }),
      phone: tags.phone || tags['contact:phone'] || tags['emergency:phone'] || '',
      address,
    });
  }

  return hospitals.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 6);
}

function formatDistance(distanceKm: number) {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m away`;
  return `${distanceKm.toFixed(1)} km away`;
}

function formatReportTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function callHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export default function Emergency() {
  const supabase = createClient();
  const { success, error: toastError, info } = useToast();
  const [userId, setUserId] = useState('local');
  const [storageKey, setStorageKey] = useState('selorah_emergency_reports_local');
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);

  const [emergencyType, setEmergencyType] = useState('medical');
  const [description, setDescription] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [draftReady, setDraftReady] = useState(false);
  const [lastKnownLocation, setLastKnownLocation] = useState<LastKnownLocation | null>(null);
  const [placeBusy, setPlaceBusy] = useState(false);
  const canRecordInApp =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined';
  const microphonePermission = usePermissionState('microphone');
  const locationPermission = usePermissionState('geolocation');
  const hospitalLookup = useAsyncAction(findHospitals, {
    errorMessage: () =>
      'Nearby hospital lookup could not reach OpenStreetMap. Call 112 now or use the map link.',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voicePreview, setVoicePreview] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SavedReport | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const locationLabelRef = useRef<HTMLInputElement | null>(null);
  const nativeRecorderRef = useRef<HTMLInputElement | null>(null);
  const draftKey = draftKeyFor(userId);

  const syncPending = useCallback(
    async (activeUserId: string) => {
      if (activeUserId === 'local') return;
      const key = `selorah_emergency_reports_${activeUserId}`;
      const local = readReports(key);
      const pending = local.filter((report) => !report.synced);
      if (!pending.length) return;

      let changed = false;
      for (const report of pending) {
        try {
          const { error } = await supabase.from('emergency_reports').upsert(
            {
              id: report.id,
              user_id: activeUserId,
              reference: report.reference,
              emergency_type: report.emergency_type,
              description: report.description,
              latitude: report.latitude,
              longitude: report.longitude,
              location_label: report.location_label,
              nearest_hospital: report.nearest_hospital,
              photo_url: report.photo_url,
              voice_url: report.voice_url,
              status: report.status,
            },
            { onConflict: 'id' },
          );
          if (!error) {
            report.synced = true;
            changed = true;
          }
        } catch {
          // Keep the report queued.
        }
      }

      if (changed) {
        writeReports(key, local);
        setReports(local);
      }
    },
    [supabase],
  );

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      let activeUserId = readLocalSession()?.id || 'local';
      if (!isOffline()) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user?.id) activeUserId = session.user.id;
        } catch {
          // Offline sessions still use the local queue.
        }
      }
      if (cancelled) return;

      setUserId(activeUserId);
      const key = `selorah_emergency_reports_${activeUserId}`;
      setStorageKey(key);
      setReports(readReports(key));

      const draft = readDraft(draftKeyFor(activeUserId));
      if (draft) {
        setEmergencyType(draft.emergencyType);
        setDescription(draft.description);
        setLocationLabel(draft.locationLabel);
        setLocation(draft.location);
        setManualLat(draft.manualLat);
        setManualLon(draft.manualLon);
        setManualOpen(draft.manualOpen);
        setHospitals(draft.hospitals);
      }

      setLastKnownLocation(readLastLocation());
      setDraftReady(true);
      setLoading(false);
      void syncPending(activeUserId);
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, [supabase, syncPending]);

  useEffect(() => {
    if (!draftReady) return;

    // Debounce so typing does not hit localStorage on every key press. The
    // service worker reload is not instant either, so a short delay is safe.
    const timer = window.setTimeout(() => {
      const hasContent =
        Boolean(description.trim()) ||
        Boolean(locationLabel.trim()) ||
        Boolean(location) ||
        Boolean(manualLat.trim()) ||
        Boolean(manualLon.trim()) ||
        hospitals.length > 0;

      if (!hasContent) {
        writeDraft(draftKey, null);
        return;
      }

      writeDraft(draftKey, {
        emergencyType,
        description,
        locationLabel,
        location,
        manualLat,
        manualLon,
        manualOpen,
        hospitals,
        savedAt: Date.now(),
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [
    draftReady,
    draftKey,
    emergencyType,
    description,
    locationLabel,
    location,
    manualLat,
    manualLon,
    manualOpen,
    hospitals,
  ]);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setRecordSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  useEffect(() => {
    return () => {
      if (voicePreview) URL.revokeObjectURL(voicePreview);
    };
  }, [voicePreview]);

  const refreshHospitals = async (next: Coordinates) => {
    const result = await hospitalLookup.run(next);
    if (result.ok) setHospitals(result.data);
  };

  const focusLocationLabel = () => {
    locationLabelRef.current?.focus();
    locationLabelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const rememberLocation = (next: Coordinates, label: string) => {
    setLastKnownLocation(writeLastLocation(next, label));
  };

  const applyLastKnownLocation = async () => {
    if (!lastKnownLocation) return;

    const next = { lat: lastKnownLocation.lat, lon: lastKnownLocation.lon };
    setLocation(next);
    if (!locationLabel.trim()) setLocationLabel(lastKnownLocation.label);
    await refreshHospitals(next);
  };

  const offerLocationFallback = async () => {
    if (lastKnownLocation) {
      const useLast = await confirmDialog({
        title: 'Use your last known location?',
        message: `We could not get a fresh GPS fix. Your last known location was saved ${formatLastKnownTime(
          lastKnownLocation.savedAt,
        )}. It may not be where you are now.`,
        confirmLabel: 'Use last known',
        cancelLabel: 'Type a landmark',
        icon: 'info',
      });

      if (useLast) {
        await applyLastKnownLocation();
        return 'last-known' as const;
      }

      focusLocationLabel();
      return 'landmark' as const;
    }

    const retry = await confirmDialog({
      title: 'We could not get your location',
      message:
        'GPS can be slow indoors. Type a landmark such as a street, estate, or hospital name, then tap Find hospitals near this place.',
      confirmLabel: 'Try again',
      cancelLabel: 'Type a landmark',
      icon: 'info',
    });

    if (retry) return 'retry' as const;

    focusLocationLabel();
    return 'landmark' as const;
  };

  const shareCurrentLocation = async () => {
    if (!navigator.geolocation) {
      focusLocationLabel();
      toastError('Location is not available in this browser. Type a landmark instead.');
      return;
    }

    let permissionPrompted = false;

    if (locationPermission === 'denied') {
      const retry = await showPermissionHelp('geolocation', {
        cancelLabel: lastKnownLocation ? 'Use last known' : 'Type a landmark',
      });

      if (!retry) {
        if (lastKnownLocation) await applyLastKnownLocation();
        else focusLocationLabel();
        return;
      }

      permissionPrompted = true;
    }

    setLocating(true);
    let next: Coordinates | null = null;

    try {
      next = await getCurrentCoordinates();
    } catch (error) {
      setLocating(false);

      if (isPermissionDeniedError(error)) {
        if (permissionPrompted) {
          toastError('Location is still blocked. Type a landmark or use your last known location.');
          if (lastKnownLocation) await applyLastKnownLocation();
          else focusLocationLabel();
          return;
        }

        const retry = await showPermissionHelp('geolocation', {
          cancelLabel: lastKnownLocation ? 'Use last known' : 'Type a landmark',
        });

        if (retry) {
          setLocating(true);
          try {
            next = await getCurrentCoordinates();
          } catch {
            setLocating(false);
            toastError('Location is still blocked. Type a landmark or use your last known location.');
            if (lastKnownLocation) await applyLastKnownLocation();
            else focusLocationLabel();
            return;
          }
        } else {
          if (lastKnownLocation) await applyLastKnownLocation();
          else focusLocationLabel();
          return;
        }
      } else {
        const choice = await offerLocationFallback();
        if (choice === 'retry') void shareCurrentLocation();
        return;
      }
    }

    if (!next) {
      setLocating(false);
      return;
    }

    setLocation(next);
    setLocating(false);
    rememberLocation(next, locationLabel.trim() || 'Current location');
    await refreshHospitals(next);
  };

  const findPlace = async () => {
    const query = locationLabel.trim();
    if (!query) {
      focusLocationLabel();
      toastError('Type a landmark or area first.');
      return;
    }

    setPlaceBusy(true);
    try {
      const place = await geocodePlace(query);
      const next = { lat: place.lat, lon: place.lon };
      setLocation(next);
      setLocationLabel(query);
      rememberLocation(next, place.label);
      setPlaceBusy(false);
      await refreshHospitals(next);
    } catch (error) {
      setPlaceBusy(false);
      toastError(error instanceof Error ? error.message : 'Could not find that place.');
      focusLocationLabel();
    }
  };

  const applyManualCoordinates = async () => {
    const lat = Number(manualLat);
    const lon = Number(manualLon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      toastError('Enter a valid latitude and longitude.');
      return;
    }
    const next = { lat, lon };
    setLocation(next);
    rememberLocation(next, locationLabel.trim() || 'Manual coordinates');
    await refreshHospitals(next);
  };

  const selectPhoto = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toastError('Choose a photo under 15 MB.');
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const selectVoice = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toastError('Choose an audio file under 25 MB.');
      return;
    }
    if (voicePreview) URL.revokeObjectURL(voicePreview);
    setVoiceBlob(file);
    setVoicePreview(URL.createObjectURL(file));
  };

  const startRecording = async () => {
    const canUseMicrophone = Boolean(navigator.mediaDevices?.getUserMedia);

    if (!canUseMicrophone) {
      const usePhoneRecorder = await confirmDialog({
        title: 'Microphone is not available in this app',
        message: window.isSecureContext
          ? 'This installed app cannot ask for microphone access. Record with your phone app, or open Selorah in Safari or Chrome. You can also upload an audio file.'
          : 'Selorah needs a secure HTTPS connection to use the microphone. Open the live site in your browser, or record with your phone app.',
        confirmLabel: 'Use phone recorder',
        cancelLabel: 'Upload audio file',
        icon: 'info',
      });
      if (usePhoneRecorder) nativeRecorderRef.current?.click();
      else document.getElementById('voice-upload')?.click();
      return;
    }

    let permissionPrompted = false;

    if (microphonePermission === 'denied') {
      // The browser will not show its own prompt after a block, so show the
      // settings path before calling getUserMedia. This is deterministic on
      // browsers that expose the Permissions API.
      const retry = await showPermissionHelp('microphone');
      if (!retry) return;
      permissionPrompted = true;
    }

    let stream: MediaStream | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        if (permissionPrompted) {
          toastError('Microphone is still blocked. Use your phone recorder or upload an audio file.');
          return;
        }

        // The native prompt is already gone after a block. Show the exact
        // settings path, then retry from the dialog button if the patient has
        // changed the setting.
        const retry = await showPermissionHelp('microphone');
        if (retry) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch {
            toastError(
              'Microphone is still blocked. Use your phone recorder or upload an audio file.'
            );
            return;
          }
        } else {
          return;
        }
      } else if (error instanceof DOMException && error.name === 'NotFoundError') {
        toastError('No microphone was found. Use your phone recorder or upload an audio file.');
        return;
      } else if (error instanceof DOMException && error.name === 'NotReadableError') {
        toastError('Another app is using the microphone. Close it and try again.');
        return;
      } else {
        toastError('Microphone access was blocked. Use your phone recorder or upload an audio file.');
        return;
      }
    }

    if (!stream) return;

    if (typeof MediaRecorder === 'undefined') {
      stream.getTracks().forEach((track) => track.stop());
      const usePhoneRecorder = await confirmDialog({
        title: 'Microphone access granted',
        message:
          'This browser cannot record audio inside the app. Record with your phone app, then choose the file here. You can also upload an existing audio file.',
        confirmLabel: 'Use phone recorder',
        cancelLabel: 'Upload audio file',
        icon: 'info',
      });
      if (usePhoneRecorder) nativeRecorderRef.current?.click();
      else document.getElementById('voice-upload')?.click();
      return;
    }

    const activeStream = stream;

    try {
      streamRef.current = activeStream;
      const preferredMime = preferredAudioMimeType();
      let recorder: MediaRecorder;
      try {
        recorder = preferredMime
          ? new MediaRecorder(activeStream, { mimeType: preferredMime })
          : new MediaRecorder(activeStream);
      } catch {
        recorder = new MediaRecorder(activeStream);
      }
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type =
          chunksRef.current[0]?.type || recorder.mimeType || preferredMime || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        if (blob.size > 25 * 1024 * 1024) {
          toastError('The voice note is too large. Record a shorter note or upload a smaller file.');
        } else if (blob.size === 0) {
          toastError('No audio was captured. Check your microphone and try again.');
        } else {
          if (voicePreview) URL.revokeObjectURL(voicePreview);
          setVoiceBlob(blob);
          setVoicePreview(URL.createObjectURL(blob));
        }
        activeStream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start(1000);
      recorderRef.current = recorder;
      setRecordSeconds(0);
      setRecording(true);
    } catch {
      activeStream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      toastError('The microphone could not start. Upload an audio file instead.');
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  const openMicrophonePermissionHelp = () => {
    void showPermissionHelp('microphone', {
      confirmLabel: 'I understand',
      cancelLabel: 'Close',
    });
  };

  const openLocationPermissionHelp = () => {
    void showPermissionHelp('geolocation', {
      confirmLabel: 'I understand',
      cancelLabel: 'Close',
    });
  };

  const removePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview('');
  };

  const removeVoice = () => {
    if (voicePreview) URL.revokeObjectURL(voicePreview);
    setVoiceBlob(null);
    setVoicePreview('');
  };

  const saveReport = (report: SavedReport, key = storageKey) => {
    const existing = readReports(key);
    const next = [report, ...existing.filter((item) => item.id !== report.id)].slice(0, 25);
    setReports(next);
    writeReports(key, next);
    if (key !== storageKey) setStorageKey(key);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (recording) {
      toastError('Stop the voice recording before saving.');
      return;
    }
    if (!description.trim() && !photoFile && !voiceBlob) {
      toastError('Add a short description, a photo, or a voice note.');
      return;
    }

    setSubmitting(true);
    const id = newId();
    const reference = `EMG-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    let activeUserId = userId;
    let photoPath: string | null = null;
    let voicePath: string | null = null;

    if (activeUserId === 'local') {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          activeUserId = user.id;
          setUserId(user.id);
        }
      } catch {
        // The report can still be saved locally.
      }
    }

    if (activeUserId !== 'local') {
      if (photoFile) {
        const path = `${activeUserId}/${id}/photo-${Date.now()}.${extensionFor(photoFile, 'jpg')}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, photoFile, {
          upsert: true,
          contentType: photoFile.type || 'image/jpeg',
        });
        if (!error) photoPath = path;
      }

      if (voiceBlob) {
        const path = `${activeUserId}/${id}/voice-${Date.now()}.${extensionFor(voiceBlob, 'webm')}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, voiceBlob, {
          upsert: true,
          contentType: voiceBlob.type || 'audio/webm',
        });
        if (!error) voicePath = path;
      }
    }

    const report: SavedReport = {
      id,
      reference,
      emergency_type: emergencyType,
      description: description.trim(),
      latitude: location?.lat ?? null,
      longitude: location?.lon ?? null,
      location_label: locationLabel.trim(),
      nearest_hospital: hospitals,
      photo_url: photoPath,
      voice_url: voicePath,
      status: 'submitted',
      created_at: new Date().toISOString(),
      synced: false,
    };

    let savedRemote = false;
    if (activeUserId !== 'local') {
      try {
        const { error } = await supabase.from('emergency_reports').insert({
          id: report.id,
          user_id: activeUserId,
          reference: report.reference,
          emergency_type: report.emergency_type,
          description: report.description,
          latitude: report.latitude,
          longitude: report.longitude,
          location_label: report.location_label,
          nearest_hospital: report.nearest_hospital,
          photo_url: report.photo_url,
          voice_url: report.voice_url,
          status: report.status,
        });
        savedRemote = !error;
      } catch {
        savedRemote = false;
      }
    }

    const stored = { ...report, synced: savedRemote };
    const reportKey =
      activeUserId === 'local'
        ? storageKey
        : `selorah_emergency_reports_${activeUserId}`;
    saveReport(stored, reportKey);
    setResult(stored);
    setSubmitting(false);

    // The report is saved, so the draft no longer needs to survive a reload.
    // Clear both keys in case the user id was discovered during submit.
    writeDraft(draftKeyFor(userId), null);
    if (activeUserId !== userId) writeDraft(draftKeyFor(activeUserId), null);
    setEmergencyType('medical');
    setDescription('');
    setLocationLabel('');
    setLocation(null);
    setManualLat('');
    setManualLon('');
    setManualOpen(false);
    setHospitals([]);
    hospitalLookup.reset();
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview('');
    setVoiceBlob(null);
    if (voicePreview) URL.revokeObjectURL(voicePreview);
    setVoicePreview('');

    if (savedRemote) {
      success('Emergency report saved.', `Reference ${reference}`);
    } else {
      info('Saved on this device. Call the hospital directly.', `Reference ${reference}`);
    }
  };

  const findingHospitals = hospitalLookup.isLoading;
  const hospitalError =
    hospitalLookup.error ??
    (hospitalLookup.isSuccess && hospitals.length === 0
      ? 'No hospital was found within 15 km. Call 112 now and use the map link.'
      : '');
  const activeHospital = result?.nearest_hospital?.[0] || hospitals[0] || null;
  const reportCount = useMemo(() => reports.length, [reports]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-500">
            Emergency
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[#101217] sm:text-3xl">
            Emergency report
          </h1>
          <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-gray-500 sm:text-sm">
            Save what happened, attach a photo or voice note, and find the nearest hospital.
            Selorah does not dispatch ambulances. If this is life threatening, call 112 now.
          </p>
        </div>
        <a
          href={`tel:${EMERGENCY_NUMBER}`}
          className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-full bg-[#B42318] px-6 text-sm font-black text-white shadow-lg shadow-red-500/20 transition-colors hover:bg-[#912018]"
        >
          <PhoneIcon className="h-5 w-5" />
          Call 112 now
        </a>
      </div>

      <div className="rounded-[22px] border border-red-100 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-[11px] font-medium leading-relaxed text-red-700">
            Call 112 first for chest pain, heavy bleeding, difficulty breathing, a seizure,
            unconsciousness, or a pregnancy emergency. Use this form to keep a record and find
            nearby care, not as a replacement for emergency services.
          </p>
        </div>
      </div>

      {result && (
        <section className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-[#101217]">
                Report saved. Reference {result.reference}
              </h2>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-600">
                {result.synced
                  ? 'This report is in your private Selorah record.'
                  : 'This report is on this device. It will sync when the connection returns.'}
              </p>
              {activeHospital && (
                <div className="mt-3 rounded-xl bg-white/70 p-3">
                  <p className="text-xs font-bold text-[#101217]">{activeHospital.name}</p>
                  <p className="mt-0.5 text-[10px] font-medium text-gray-500">
                    {formatDistance(activeHospital.distanceKm)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeHospital.phone && (
                      <a
                        href={callHref(activeHospital.phone)}
                        className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-primary px-3.5 text-[10px] font-bold text-white"
                      >
                        <PhoneIcon className="h-3.5 w-3.5" />
                        Call hospital
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${activeHospital.lat},${activeHospital.lon}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 text-[10px] font-bold text-[#101217]"
                    >
                      <MapPinIcon className="h-3.5 w-3.5" />
                      Directions
                    </a>
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setResult(null)}
              aria-label="Dismiss saved report"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-white"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      <form
        onSubmit={submit}
        data-state={submitting ? 'submitting' : result ? 'saved' : 'editing'}
        className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-7"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
            <ShieldCheckIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-[#101217]">Report details</h2>
            <p className="text-[11px] font-medium text-gray-400">
              Only you can see this report and its attachments.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              What happened
            </span>
            <select
              value={emergencyType}
              onChange={(event) => setEmergencyType(event.target.value)}
              className="mt-1.5 min-h-[46px] w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-semibold text-[#101217] outline-none transition-colors focus:border-primary"
            >
              {TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              Location or landmark
            </span>
            <input
              ref={locationLabelRef}
              value={locationLabel}
              onChange={(event) => setLocationLabel(event.target.value)}
              placeholder="e.g. Ikeja, near Allen Avenue"
              className="mt-1.5 min-h-[46px] w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:text-gray-300 focus:border-primary"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
            Describe the emergency
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="What happened, what you see, and any known allergies or medicines."
            className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm font-medium text-[#101217] outline-none transition-colors placeholder:text-gray-300 focus:border-primary"
          />
        </label>

        <div
          className="mt-4 rounded-2xl border border-gray-200 p-4"
          data-permission={locationPermission}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold text-[#101217]">Location for hospital lookup</p>
              <p className="mt-0.5 text-[10px] font-medium text-gray-400">
                {location
                  ? `${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}`
                  : 'Share your location to find nearby hospitals.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void shareCurrentLocation()}
              disabled={locating}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full bg-primary px-4 text-[11px] font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {locating ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <MapPinIcon className="h-4 w-4" />
              )}
              Use my location
            </button>
          </div>

          <button
            type="button"
            onClick={() => setManualOpen((value) => !value)}
            className="mt-3 text-[10px] font-bold text-primary hover:underline"
          >
            {manualOpen ? 'Hide manual coordinates' : 'Enter coordinates manually'}
          </button>

          {manualOpen && (
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                value={manualLat}
                onChange={(event) => setManualLat(event.target.value)}
                inputMode="decimal"
                placeholder="Latitude"
                className="min-h-[40px] rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-[#101217] outline-none focus:border-primary"
              />
              <input
                value={manualLon}
                onChange={(event) => setManualLon(event.target.value)}
                inputMode="decimal"
                placeholder="Longitude"
                className="min-h-[40px] rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-[#101217] outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => void applyManualCoordinates()}
                className="min-h-[40px] rounded-xl border border-gray-200 bg-white px-4 text-[11px] font-bold text-[#101217] transition-colors hover:border-primary/30"
              >
                Find hospitals
              </button>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void findPlace()}
              disabled={placeBusy || !locationLabel.trim()}
              className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 text-[10px] font-bold text-[#101217] transition-colors hover:border-primary/30 disabled:opacity-50"
            >
              {placeBusy ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
              ) : (
                <MapPinIcon className="h-3.5 w-3.5" />
              )}
              Find hospitals near this place
            </button>
            {lastKnownLocation && (
              <button
                type="button"
                onClick={() => void applyLastKnownLocation()}
                title={`Saved ${formatLastKnownTime(lastKnownLocation.savedAt)}`}
                className="min-h-[36px] rounded-full border border-gray-200 bg-white px-3.5 text-[10px] font-bold text-[#101217] transition-colors hover:border-primary/30"
              >
                Use last known location
              </button>
            )}
          </div>
          <p className="mt-2 text-[10px] font-medium leading-relaxed text-gray-400">
            No GPS? Type a street, estate, or landmark above, then search. Last known location is
            kept for 24 hours on this device.
          </p>

          {location && (
            <a
              href={`https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lon}#map=16/${location.lat}/${location.lon}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold text-primary hover:underline"
            >
              <MapPinIcon className="h-3.5 w-3.5" />
              Open this point in a map
            </a>
          )}

          {locationPermission === 'denied' && (
            <p className="mt-2 text-[10px] font-semibold text-amber-600">
              Location is blocked for Selorah.{' '}
              <button
                type="button"
                onClick={() => void openLocationPermissionHelp()}
                className="underline"
              >
                How to enable
              </button>
            </p>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-bold text-[#101217]">Photo</p>
            <p className="mt-0.5 text-[10px] font-medium text-gray-400">
              A clear photo of the scene or injury. Do not photograph faces without consent.
            </p>
            {photoPreview ? (
              <div className="mt-3">
                <img
                  src={photoPreview}
                  alt="Emergency attachment preview"
                  className="h-32 w-full rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-red-500"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                  Remove photo
                </button>
              </div>
            ) : (
              <label className="mt-3 flex min-h-[74px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-200 text-gray-400 transition-colors hover:border-primary/40 hover:text-primary">
                <CameraIcon className="h-5 w-5" />
                <span className="text-[10px] font-bold">Add a photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(event) => selectPhoto(event.target.files?.[0])}
                />
              </label>
            )}
          </div>

          <div
            className="rounded-2xl border border-gray-200 p-4"
            data-permission={microphonePermission}
            data-state={recording ? 'recording' : voiceBlob ? 'ready' : 'idle'}
          >
            <p className="text-xs font-bold text-[#101217]">Voice note</p>
            <p className="mt-0.5 text-[10px] font-medium text-gray-400">
              Record what you see if typing is difficult.
            </p>
            {voicePreview ? (
              <div className="mt-3">
                <audio
                  controls
                  preload="metadata"
                  src={voicePreview}
                  className="w-full"
                  onError={() =>
                    toastError(
                      'This browser could not play the recording. Upload an audio file instead.',
                    )
                  }
                />
                <button
                  type="button"
                  onClick={removeVoice}
                  className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-red-500"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                  Remove voice note
                </button>
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={recording ? stopRecording : () => void startRecording()}
                  className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border text-[11px] font-bold transition-colors ${
                    recording
                      ? 'border-red-200 bg-red-50 text-red-600'
                      : 'border-gray-200 bg-white text-[#101217] hover:border-primary/30'
                  }`}
                >
                  {recording ? (
                    <>
                      <StopIcon className="h-4 w-4" />
                      Stop recording ({Math.floor(recordSeconds / 60)}:
                      {String(recordSeconds % 60).padStart(2, '0')})
                    </>
                  ) : (
                    <>
                      <MicrophoneIcon className="h-4 w-4" />
                      Record a voice note
                    </>
                  )}
                </button>
                <label className="inline-flex min-h-[36px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-200 text-[10px] font-bold text-gray-400 transition-colors hover:border-primary/40 hover:text-primary">
                  <ArrowPathIcon className="h-3.5 w-3.5" />
                  Or upload an audio file
                  <input
                    id="voice-upload"
                    type="file"
                    accept="audio/*"
                    className="sr-only"
                    onChange={(event) => selectVoice(event.target.files?.[0])}
                  />
                </label>
                {!canRecordInApp && (
                  <button
                    type="button"
                    onClick={() => nativeRecorderRef.current?.click()}
                    className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-200 text-[10px] font-bold text-gray-400 transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <MicrophoneIcon className="h-3.5 w-3.5" />
                    Use phone recorder
                  </button>
                )}
                <input
                  ref={nativeRecorderRef}
                  type="file"
                  accept="audio/*"
                  capture
                  className="sr-only"
                  onChange={(event) => selectVoice(event.target.files?.[0])}
                />
              </div>
            )}

            {microphonePermission === 'denied' && (
              <p className="mt-2 text-[10px] font-semibold text-amber-600">
                Microphone is blocked for Selorah.{' '}
                <button
                  type="button"
                  onClick={() => void openMicrophonePermissionHelp()}
                  className="underline"
                >
                  How to enable
                </button>
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] font-medium leading-relaxed text-gray-400">
            Draft saved on this device. You can submit even if the network drops.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-[#B42318] px-5 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-colors hover:bg-[#912018] disabled:opacity-60"
          >
            {submitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <PaperAirplaneIcon className="h-4 w-4" />
            )}
            Save emergency report
          </button>
        </div>
      </form>

      <section className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#101217]">Nearest hospitals</h2>
            <p className="text-[11px] font-medium text-gray-400">
              OpenStreetMap data within 15 km. Call before you travel.
            </p>
          </div>
          {location && (
            <button
              type="button"
              onClick={() => void refreshHospitals(location)}
              disabled={findingHospitals}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-gray-200 px-3.5 text-[10px] font-bold text-gray-500 transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-60"
            >
              <ArrowPathIcon className={`h-3.5 w-3.5 ${findingHospitals ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>

        {hospitalError && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-[11px] font-medium leading-relaxed text-red-600">
            {hospitalError}
          </p>
        )}

        {findingHospitals ? (
          <div className="flex items-center justify-center py-8">
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          </div>
        ) : hospitals.length ? (
          <div className="mt-4 divide-y divide-gray-50">
            {hospitals.map((hospital) => (
              <div
                key={hospital.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-start gap-2">
                    <BuildingOffice2Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#101217]">{hospital.name}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-gray-400">
                        {formatDistance(hospital.distanceKm)}
                        {hospital.address ? ` · ${hospital.address}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {hospital.phone ? (
                    <a
                      href={callHref(hospital.phone)}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-primary px-3.5 text-[10px] font-bold text-white"
                    >
                      <PhoneIcon className="h-3.5 w-3.5" />
                      Call
                    </a>
                  ) : (
                    <span className="inline-flex min-h-[36px] items-center rounded-full bg-gray-50 px-3.5 text-[10px] font-bold text-gray-400">
                      No phone listed
                    </span>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lon}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-gray-200 px-3.5 text-[10px] font-bold text-[#101217]"
                  >
                    <MapPinIcon className="h-3.5 w-3.5" />
                    Directions
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-gray-200 p-6 text-center">
            <p className="text-sm font-bold text-[#101217]">Share your location to find care.</p>
            <p className="mx-auto mt-1 max-w-md text-[11px] font-medium leading-relaxed text-gray-400">
              We use OpenStreetMap to list nearby hospitals. If the lookup fails, call 112 and
              use the map link for your location.
            </p>
            <button
              type="button"
              onClick={() => void shareCurrentLocation()}
              disabled={locating}
              className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-full bg-primary px-5 text-[11px] font-bold text-white disabled:opacity-60"
            >
              <MapPinIcon className="h-4 w-4" />
              Find hospitals near me
            </button>
          </div>
        )}
      </section>

      {reportCount > 0 && (
        <section className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-base font-bold text-[#101217]">Recent reports on this device</h2>
          <p className="text-[11px] font-medium text-gray-400">
            References you can read to a dispatcher or hospital.
          </p>
          <div className="mt-4 divide-y divide-gray-50">
            {reports.slice(0, 5).map((report) => (
              <div
                key={report.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-[#101217]">
                    {report.reference} · {TYPES.find((type) => type.id === report.emergency_type)?.label || report.emergency_type}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium text-gray-400">
                    {formatReportTime(report.created_at)} ·{' '}
                    {report.synced ? 'Synced' : 'Saved on this device'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {report.nearest_hospital[0]?.phone && (
                    <a
                      href={callHref(report.nearest_hospital[0].phone)}
                      className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full border border-gray-200 px-3 text-[10px] font-bold text-[#101217]"
                    >
                      <PhoneIcon className="h-3.5 w-3.5" />
                      {report.nearest_hospital[0].name}
                    </a>
                  )}
                  <a
                    href={`tel:${EMERGENCY_NUMBER}`}
                    className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[#B42318] px-3 text-[10px] font-bold text-white"
                  >
                    <PhoneIcon className="h-3.5 w-3.5" />
                    Call 112
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
