import { z } from "zod";

/** Eine Operation, wie Claude sie aus Ninas Satz ableitet (striktes JSON). */
export const AiOperationSchema = z.object({
  action: z.enum(["create", "update", "delete", "complete"]),
  target_id: z
    .string()
    .nullable()
    .describe("For update/delete/complete: id of the existing task. null for create or when ambiguous."),
  candidate_ids: z
    .array(z.string())
    .describe("Only when it is unclear which existing task is meant: the ids of all plausible matches. Otherwise []."),
  title: z.string().describe("Short task title in Nina's language, without dates or times."),
  area: z.enum(["work", "life"]),
  list_name: z.string().nullable().describe("Life Mode list name from the given lists, or null (= Allgemein). Work Mode: null."),
  due_date: z.string().nullable().describe("YYYY-MM-DD or null"),
  due_time: z.string().nullable().describe("HH:mm (24h) or null for all-day"),
  reminder: z.enum(["none", "due", "day_before", "custom"]),
  reminder_date: z.string().nullable().describe("YYYY-MM-DD, only for reminder = custom"),
  reminder_time: z.string().nullable().describe("HH:mm, only for reminder = custom"),
  repeat_rule: z
    .string()
    .nullable()
    .describe("RRULE subset or null: FREQ=DAILY | FREQ=WEEKLY;BYDAY=MO,TH | FREQ=MONTHLY | FREQ=YEARLY"),
  priority: z.boolean(),
  note: z.string(),
});

export const AiResultSchema = z.object({
  operations: z.array(AiOperationSchema),
});

export type AiOperation = z.infer<typeof AiOperationSchema>;
