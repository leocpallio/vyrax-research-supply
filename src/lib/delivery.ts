import { site } from "../data/site";

/** Static cut-off wording; avoid a countdown that implies weekend/bank-holiday dispatch. */
export function dispatchCutoffLabel(): string {
  const hour = site.dispatchCutoffHour;
  if (hour < 1 || hour > 23 || !Number.isInteger(hour)) throw new Error("Invalid dispatch cutoff");
  return hour > 12 ? `${hour - 12}pm UK time` : hour === 12 ? "12pm UK time" : `${hour}am UK time`;
}
