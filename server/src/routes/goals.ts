import { Router } from "express";
import { z } from "zod";
import { Entry } from "../models/Entry";
import { Goal } from "../models/Goal";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { requireMongoUser } from "../middleware/attachMongoUser";
import { dayOfWeekIndex, isValidLocalDate } from "../utils/date";

export const goalsRouter = Router();
goalsRouter.use(requireMongoUser);

const recurrenceSchema = z
  .object({
    type: z.enum(["daily", "weekly", "once"]),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).optional(),
  })
  .refine((r) => r.type !== "weekly" || (r.daysOfWeek && r.daysOfWeek.length > 0), {
    message: "daysOfWeek is required when recurrence.type is 'weekly'",
    path: ["daysOfWeek"],
  });

const createGoalSchema = z.object({
  title: z.string().trim().min(1).max(80),
  icon: z.string().max(40).nullable().optional(),
  source: z.enum(["recommended", "custom"]),
  recurrence: recurrenceSchema,
  dueTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "dueTime must be HH:mm")
    .nullable()
    .optional(),
  timezone: z.string().min(1),
});

const updateGoalSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  recurrence: recurrenceSchema.optional(),
  dueTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "dueTime must be HH:mm")
    .nullable()
    .optional(),
});

// POST /api/v1/goals
goalsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = createGoalSchema.parse(req.body);
    const goal = await Goal.create({ ...body, userId: req.user!._id });
    return res.status(201).json({ goal });
  })
);

// GET /api/v1/goals
goalsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const goals = await Goal.find({ userId: req.user!._id, active: true }).sort({ createdAt: -1 });
    return res.status(200).json({ goals });
  })
);

// GET /api/v1/goals/today?localDate=YYYY-MM-DD&tz=IANA
// Recurrence is stored as a rule, not materialized per-day rows, so "today's
// goals" is computed on the fly: the client's device is the source of truth
// for "what day is it" (never the server's UTC clock), passed as localDate.
goalsRouter.get(
  "/today",
  asyncHandler(async (req, res) => {
    const localDate = String(req.query.localDate ?? "");
    if (!isValidLocalDate(localDate)) {
      throw new HttpError(400, "localDate query param is required, format YYYY-MM-DD");
    }

    const goals = await Goal.find({ userId: req.user!._id, active: true });

    const todayDow = dayOfWeekIndex(localDate);
    const dueGoals = goals.filter((goal) => {
      if (goal.recurrence.type === "daily") return true;
      if (goal.recurrence.type === "weekly") return goal.recurrence.daysOfWeek?.includes(todayDow) ?? false;
      return true; // "once": stays due every day until completed, see below
    });

    const dueGoalIds = dueGoals.map((g) => g._id);
    const completedTodayEntries = await Entry.find({
      userId: req.user!._id,
      goalId: { $in: dueGoalIds },
      localDate,
    }).select("goalId");
    const completedTodayGoalIds = new Set(completedTodayEntries.map((e) => e.goalId.toString()));

    // "once" goals are due every day until ever completed (any localDate),
    // then should stop appearing entirely — check across all history, not
    // just today's entries.
    const onceGoalIds = dueGoals.filter((g) => g.recurrence.type === "once").map((g) => g._id);
    const everCompletedOnceGoalIds = new Set(
      (await Entry.find({ userId: req.user!._id, goalId: { $in: onceGoalIds } }).distinct("goalId")).map((id) =>
        id.toString()
      )
    );

    const results = dueGoals
      .filter((goal) => goal.recurrence.type !== "once" || !everCompletedOnceGoalIds.has(goal.id))
      .map((goal) => ({
        ...goal.toObject(),
        completed: completedTodayGoalIds.has(goal.id),
      }));

    return res.status(200).json({ goals: results, localDate });
  })
);

// PATCH /api/v1/goals/:id
goalsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!goal) throw new HttpError(404, "Goal not found");

    const updates = updateGoalSchema.parse(req.body);
    Object.assign(goal, updates);
    await goal.save();
    return res.status(200).json({ goal });
  })
);

// DELETE /api/v1/goals/:id — soft-delete, preserves entry history
goalsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!goal) throw new HttpError(404, "Goal not found");

    goal.active = false;
    await goal.save();
    return res.status(204).send();
  })
);
