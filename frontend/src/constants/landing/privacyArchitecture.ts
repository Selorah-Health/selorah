import { LockClosedIcon, ShieldCheckIcon, XCircleIcon } from "@heroicons/react/24/outline";

import type { PrivacyArchitectureCard } from "../../types/landing/privacyArchitecture";

export const PRIVACY_ARCHITECTURE_CARDS: PrivacyArchitectureCard[] = [
  {
    Icon: LockClosedIcon,
    num: "01",
    title: "Your key. Your phone.",
    body: "Records are encrypted on your device before uploading. Selorah's servers receive a locked file — no key, ever.",
  },
  {
    Icon: XCircleIcon,
    num: "02",
    title: "Deletion is real.",
    body: "When you delete a record, it is permanently removed from our servers and cryptographically erased.",
  },
  {
    Icon: ShieldCheckIcon,
    num: "03",
    title: "Revocation is instant.",
    body: "When you revoke access, it is recorded on the blockchain immediately and irreversibly.",
  },
];
