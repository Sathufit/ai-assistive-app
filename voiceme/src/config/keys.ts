// EAS Build injects EXPO_PUBLIC_* variables from EAS Secrets into the
// Metro bundle at build time.  Empty strings are the safe fallback for
// local development — the user can also paste keys in the Settings screen.
export const BUILT_IN_GEMINI_API_KEY: string =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

export const BUILT_IN_ELEVENLABS_API_KEY: string =
  process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY ?? '';
