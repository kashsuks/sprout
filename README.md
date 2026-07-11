# still — mobile app scaffold

Design-faithful Expo/React Native scaffold for the "still" app. Fonts, colors,
and the dashed-border/stamp primitives are wired up to match the mockup
exactly; screens are built with mock data so the UI can be reviewed before
the backend is connected.

## Setup

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android), or press `i` / `a` for a simulator.

## What's implemented (visual layer)

- `src/theme/colors.ts` — exact color tokens from the mockup's CSS variables
- `src/theme/typography.ts` — Fraunces / Caveat / Special Elite / IBM Plex Mono, loaded via `@expo-google-fonts/*`
- `src/components/DashedBorder.tsx` — SVG-based dashed rect/circle (renders identically on iOS + Android, unlike RN's native `borderStyle: 'dashed'`)
- `src/components/Stamp.tsx` — rotated wax-stamp badge (streak counter, task-type tags)
- `src/components/Ticket.tsx` — torn-ticket task row (New Entry screen)
- `src/components/DashedCard.tsx` — dashed-border card (duo streak card)
- `src/components/TabIcons.tsx` — tab bar icons, using the exact SVG path data from the original mockup HTML
- `src/screens/*` — all 7 screens from the mockup, pixel-matched to the reference images, driven by `src/data/mockData.ts`
- `src/navigation/RootNavigator.tsx` — bottom tab bar + the two sub-flows (New Entry → Complete/Stamp, Squad → Link Duo)

## What's NOT implemented yet (see the MVP plan doc for the full spec)

- No backend connection — everything reads from `src/data/mockData.ts`
- No auth (Google OAuth / email+password)
- No real photo upload (Complete/Stamp screen requests camera permission and captures a photo, but doesn't yet upload it anywhere — see the `stampIt()` TODO in `CompleteStampScreen.tsx`)
- No contacts-based friend matching
- No push notifications wiring (Expo push token registration)
- Leaderboard/feed/squad data is static, not fetched

## Suggested next prompt for Claude Code

"Using this scaffold, build the Express + MongoDB Atlas API described in the
MVP plan (auth, tasks, entries, friendships, duos, squads, leaderboard), then
wire `src/data/mockData.ts` consumers over to real `@tanstack/react-query`
hooks hitting that API. Keep every existing component and style untouched —
only swap the data source."

Starting there keeps the visual fidelity locked in while the backend gets built
underneath it.
