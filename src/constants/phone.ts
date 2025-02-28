
export const PHONE_PREFIXES = [
  { value: "+254", label: "🇰🇪 +254 (Kenya)" },
  { value: "+256", label: "🇺🇬 +256 (Uganda)" },
  { value: "+255", label: "🇹🇿 +255 (Tanzania)" },
  { value: "+251", label: "🇪🇹 +251 (Ethiopia)" },
  { value: "+250", label: "🇷🇼 +250 (Rwanda)" },
  { value: "+1", label: "🇺🇸 +1 (United States/Canada)" },
  { value: "+44", label: "🇬🇧 +44 (United Kingdom)" },
  { value: "+91", label: "🇮🇳 +91 (India)" },
  { value: "+234", label: "🇳🇬 +234 (Nigeria)" },
  { value: "+27", label: "🇿🇦 +27 (South Africa)" },
  { value: "+971", label: "🇦🇪 +971 (UAE)" },
  { value: "+61", label: "🇦🇺 +61 (Australia)" },
  { value: "+49", label: "🇩🇪 +49 (Germany)" },
  { value: "+33", label: "🇫🇷 +33 (France)" },
  { value: "+86", label: "🇨🇳 +86 (China)" },
  { value: "+55", label: "🇧🇷 +55 (Brazil)" },
  { value: "+52", label: "🇲🇽 +52 (Mexico)" },
  { value: "+81", label: "🇯🇵 +81 (Japan)" },
] as const;

export type PhonePrefix = typeof PHONE_PREFIXES[number]['value'];
