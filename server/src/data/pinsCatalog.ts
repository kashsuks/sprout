// Static, code-defined catalog rather than a seeded Mongo collection: pin
// definitions only change via a deploy, not at runtime, so there's no need
// for a DB-backed catalog + seed script. Only awards (UserPin) are stored.
export type PinCriteria = { type: "entryCount"; count: number } | { type: "streak"; days: number };

export interface PinDefinition {
  key: string;
  emoji: string;
  label: string;
  description: string;
  criteria: PinCriteria;
}

export const PINS_CATALOG: PinDefinition[] = [
  {
    key: "first_stamp",
    emoji: "🎉",
    label: "First Stamp",
    description: "Complete your first goal",
    criteria: { type: "entryCount", count: 1 },
  },
  {
    key: "streak_3",
    emoji: "🔥",
    label: "3-Day Streak",
    description: "Complete goals 3 days in a row",
    criteria: { type: "streak", days: 3 },
  },
  {
    key: "streak_7",
    emoji: "⭐",
    label: "7-Day Streak",
    description: "Complete goals 7 days in a row",
    criteria: { type: "streak", days: 7 },
  },
  {
    key: "streak_30",
    emoji: "🏆",
    label: "30-Day Streak",
    description: "Complete goals 30 days in a row",
    criteria: { type: "streak", days: 30 },
  },
];
