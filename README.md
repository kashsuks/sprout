# sprout

A little habit-tracking app for people who'd rather see a stamp on a paper
ticket than a progress bar. You do a thing, you take a photo of it, it gets
stamped into your feed. Streaks, a duo mode for keeping a friend honest, a
squad leaderboard, the usual.

This repo is the mobile app — Expo/React Native, built to match a set of
mockups pixel-for-pixel before any backend was in the picture. Right now
everything on screen is backed by fake data in `src/data/mockData.ts`, so you
can poke around the whole UI without standing up a server.

## Running it

You'll need Node installed, and either Xcode (for the iOS Simulator), Android
Studio (for an emulator), or just the Expo Go app on your phone.

```bash
npm install
npx expo start
```

That opens the Metro bundler in your terminal. From there:

- Press `i` to launch the iOS Simulator
- Press `a` for an Android emulator
- Or scan the QR code with the Expo Go app on your phone (fastest if you
  don't want to deal with simulators)

No environment variables, no API keys, nothing else to configure — it's a
self-contained frontend right now.

## What's actually here

Seven screens, wired into a bottom tab bar:

| Screen | What it does |
|---|---|
| Feed | Friends' completed tasks, plus a pinned "duo" card at the top |
| Leaderboard | Points ranking among friends |
| New Entry → Complete/Stamp | Pick a task, snap a photo, add a caption, stamp it done |
| Squad → Link Duo | Pair up with a friend on a task so you keep each other accountable |
| Profile | Your stats, streak, points |

The visual system lives in `src/theme` and `src/components`:

- `theme/colors.ts` and `theme/typography.ts` — color tokens and fonts
  (Fraunces, Caveat, Special Elite, IBM Plex Mono) pulled straight from the
  mockup
- `components/DashedBorder.tsx` — a hand-rolled SVG dashed border, because
  React Native's native `borderStyle: 'dashed'` renders differently on iOS
  vs. Android and looks wrong on one of them no matter what you do
- `components/Stamp.tsx` — the rotated wax-stamp badge used for streaks and
  task tags throughout the app
- `components/Ticket.tsx` / `DashedCard.tsx` — the torn-ticket and
  dashed-card layouts from the New Entry and Feed screens

If you're changing how something looks, it's almost certainly one of these
four files plus whichever screen you're touching.

## What's not here yet

This branch is UI-only. Specifically missing:

- A backend — every screen reads from `src/data/mockData.ts`, nothing is
  persisted or fetched over the network
- Auth of any kind
- Real photo upload — the Complete/Stamp screen will happily ask for camera
  permission and let you take a photo, but it doesn't go anywhere yet
  (see the TODO in `CompleteStampScreen.tsx`)
- Contacts-based friend finding
- Push notifications

Heads up: `package.json` and `app.json` still call the project `still`
internally (bundle identifier, slug, etc.) even though the app itself is
`sprout` now — that's a rename that happened in the README before it made it
into the config. Worth cleaning up before this ships anywhere.

There's more advanced work (a real Express/MongoDB backend, auth, a
vector-search-backed feed, likes, friends) further along on other branches
in this repo — this branch is the clean starting point before any of that
landed.
