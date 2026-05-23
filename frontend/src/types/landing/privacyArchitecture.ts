import type { ComponentType } from "react";

export interface PrivacyArchitectureCard {
  Icon: ComponentType<{ className?: string }>;
  num: string;
  title: string;
  body: string;
}
