# 🌱 sprout

![Expo SDK 54](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Node/Express](https://img.shields.io/badge/Node-Express-339933?logo=node.js&logoColor=white)
![MongoDB Atlas Vector Search](https://img.shields.io/badge/MongoDB-Atlas%20Vector%20Search-47A248?logo=mongodb&logoColor=white)
![Firebase Auth](https://img.shields.io/badge/Auth-Firebase-FFCA28?logo=firebase&logoColor=black)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

A habit-tracking app for people who'd rather see a wax stamp on a paper
ticket than a progress bar. Do a thing, take a photo, get it stamped into
your feed. Streaks, a duo mode for keeping a friend honest, a squad
leaderboard, and a monthly recap that actually feels like *your* month
instead of a generic stats screen.

## What makes this one fun

- **A feed that isn't dead on day one.** Brand new account, zero friends
  added yet? Instead of staring at an empty feed, sprout runs a MongoDB
  Atlas Vector Search query against your onboarding interests and surfaces
  real stamped entries from public profiles that match what you're into.
  It's the "For You" problem solved without an ML pipeline you have to
  babysit — Atlas embeds and searches goal titles automatically.
- **Likes, done properly.** You can like your own stuff, a friend's stuff,
  or anything from a public (non friends-only) profile — including the
  discover-feed posts above — but the API enforces exactly that boundary
  server-side, not just in the UI.
- **A duo mode with real stakes.** Link a task with a friend and you share
  a streak: both of you have to stamp it the same day or it resets. No
  half-measures.
- **Wrapped, but honest.** The monthly recap screen (stats grid, a little
  garden of sprout icons for everything you completed, "steadiest habit"
  and "busiest day" highlights, a shareable card) is built entirely from
  real data — nothing on that screen is a placeholder number.
- **A scrapbook worth opening.** Your photo history, grouped by week, with
  an honestly-overengineered transition animation when you open it from
  your profile — the filmstrip preview physically expands, rotates, and
  the photos fly into their grid slots. Was it necessary? No. Is it in
  there? Yes.

## Everything else it does

- Firebase email/password auth, with a post-signup preferences modal that
  captures what kind of content you want to see (this is what feeds the
  discover search above)
- Friends: search, send/accept/decline requests, unfriend
- Tasks/goals with daily, weekly, or one-off recurrence, photo-verified
  completion, points + streak tracking
- Squad leaderboard with lifetime / today / streak tabs
- Pins (achievements) awarded automatically off streak and completion
  milestones
- Per-user privacy: friends-only profiles are respected everywhere
  (profile views, the feed, and the like permission check)

## Project layout

This is two apps in one repo:

```
.
├── App.tsx, src/          # Expo/React Native app
│   ├── screens/           # one file per screen, feature-named
│   ├── api/hooks/         # react-query hooks, one file per backend resource
│   ├── store/              # auth state (zustand)
│   └── theme/              # colors, fonts, shared type styles
└── server/                 # Express + MongoDB (Mongoose) API
    ├── src/routes/         # one router per resource
    ├── src/services/       # business logic (streaks, pins, vector search, discover feed)
    ├── src/models/         # Mongoose schemas
    └── tests/               # vitest + supertest, run against an in-memory Mongo
```

## Running it

You'll need Node, an Expo-compatible way to run the app (Xcode/iOS
Simulator, Android Studio/emulator, or the Expo Go app on your phone), and
a MongoDB Atlas cluster + Firebase project of your own.

**1. Backend**

```bash
cd server
npm install
cp .env.example .env   # fill in MONGODB_URI + Firebase Admin credentials
npm run dev
```

The vector-search discover feed needs one extra one-time step against your
Atlas cluster:

```bash
npm run setup:vector-index
```

**2. Frontend**

```bash
npm install
cp .env.example .env   # fill in your Firebase Web App config + API URL
npx expo start
```

Then press `i` (iOS Simulator), `a` (Android emulator), or scan the QR code
with Expo Go on your phone.

**3. Tests**

```bash
cd server
npm test
```

## Tech stack

Expo / React Native · TypeScript · React Navigation · TanStack Query ·
Zustand · Express · Mongoose · MongoDB Atlas (incl. Vector Search) ·
Firebase Auth · Vitest
