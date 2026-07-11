import { useFonts } from 'expo-font';
import {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold_Italic,
} from '@expo-google-fonts/fraunces';
import { Caveat_500Medium, Caveat_600SemiBold } from '@expo-google-fonts/caveat';
import { SpecialElite_400Regular } from '@expo-google-fonts/special-elite';
import { IBMPlexMono_500Medium, IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono';

// Font family names used throughout the app. Matches the four-typeface
// system from the mockup: Fraunces (display/italic), Caveat (handwritten
// captions), Special Elite (typewriter labels/stamps), IBM Plex Mono (body/UI).
export const fonts = {
  displayItalic: 'Fraunces_600SemiBold_Italic',
  display: 'Fraunces_600SemiBold',
  displayMedium: 'Fraunces_500Medium',
  handwriting: 'Caveat_600SemiBold',
  handwritingRegular: 'Caveat_500Medium',
  typewriter: 'SpecialElite_400Regular',
  mono: 'IBMPlexMono_500Medium',
  monoBold: 'IBMPlexMono_600SemiBold',
} as const;

export function useAppFonts() {
  return useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold_Italic,
    Caveat_500Medium,
    Caveat_600SemiBold,
    SpecialElite_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });
}

// Reusable type presets
export const textStyles = {
  appLogo: { fontFamily: fonts.displayItalic, fontSize: 18 },
  screenTitle: { fontFamily: fonts.displayItalic, fontSize: 24 },
  eyebrow: {
    fontFamily: fonts.typewriter,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  caption: { fontFamily: fonts.handwritingRegular, fontSize: 16 },
  body: { fontFamily: fonts.mono, fontSize: 11 },
  bodyBold: { fontFamily: fonts.monoBold, fontSize: 11 },
  small: { fontFamily: fonts.mono, fontSize: 9.5, color: '#6b5d47' },
};
