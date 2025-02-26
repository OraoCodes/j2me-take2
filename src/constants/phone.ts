
export const PHONE_PREFIXES = [
  { value: "+254", label: "🇰🇪 +254" },
  { value: "+256", label: "🇺🇬 +256" },
  { value: "+255", label: "🇹🇿 +255" },
  { value: "+251", label: "🇪🇹 +251" },
  { value: "+250", label: "🇷🇼 +250" },
] as const;

export type PhonePrefix = typeof PHONE_PREFIXES[number]['value'];
