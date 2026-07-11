import { useFonts } from 'expo-font';
import {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold_Italic,
} from '@expo-google-fonts/fraunces';
import { MarckScript_400Regular } from '@expo-google-fonts/marck-script';
import { IBMPlexMono_500Medium, IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono';

// Font family names used throughout the app. Matches the three-typeface
// system from the mockup: Fraunces (display/italic), Marck Script
// (handwritten captions), IBM Plex Mono (body/UI/labels).
export const fonts = {
  displayItalic: 'Fraunces_600SemiBold_Italic',
  display: 'Fraunces_600SemiBold',
  displayMedium: 'Fraunces_500Medium',
  handwriting: 'MarckScript_400Regular',
  mono: 'IBMPlexMono_500Medium',
  monoBold: 'IBMPlexMono_600SemiBold',
} as const;

export function useAppFonts() {
  return useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold_Italic,
    MarckScript_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });
}

// Reusable type presets
export const textStyles = {
  appLogo: { fontFamily: fonts.displayItalic, fontSize: 18 },
  screenTitle: { fontFamily: fonts.displayItalic, fontSize: 24 },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  caption: { fontFamily: fonts.handwriting, fontSize: 17 },
  body: { fontFamily: fonts.mono, fontSize: 11 },
  bodyBold: { fontFamily: fonts.monoBold, fontSize: 11 },
  small: { fontFamily: fonts.mono, fontSize: 9.5, color: '#6d7a63' },
};
