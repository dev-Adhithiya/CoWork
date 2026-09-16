import assert from "node:assert/strict";
import { findCandidateMeetingSlots } from "./src/lib/scheduling";

const sameTimezone = findCandidateMeetingSlots([
  { userId: "a", timezone: "UTC", workingHours: { start: "09:00", end: "17:00" }, busyRanges: [] },
  { userId: "b", timezone: "UTC", workingHours: { start: "09:00", end: "17:00" }, busyRanges: [] },
], 60, { searchStart: "2026-09-17T08:00:00.000Z", days: 1 });
assert.equal(sameTimezone[0].insideWorkingHoursCount, 2);
assert.equal(sameTimezone[0].totalOffHoursMinutes, 0);

const noFullOverlap = findCandidateMeetingSlots([
  { userId: "sf", timezone: "America/Los_Angeles", workingHours: { start: "09:00", end: "10:00" }, busyRanges: [] },
  { userId: "tokyo", timezone: "Asia/Tokyo", workingHours: { start: "09:00", end: "10:00" }, busyRanges: [] },
], 60, { searchStart: "2026-09-17T00:00:00.000Z", days: 2 });
assert.ok(noFullOverlap.length > 0);
assert.ok(noFullOverlap[0].insideWorkingHoursCount < 2);

const dstEdge = findCandidateMeetingSlots([
  { userId: "ny", timezone: "America/New_York", workingHours: { start: "01:00", end: "04:00" }, busyRanges: [] },
], 30, { searchStart: "2026-03-08T06:00:00.000Z", days: 1 });
assert.ok(dstEdge.length > 0);
assert.ok(dstEdge.some((slot) => slot.localTimes[0].timezone === "America/New_York"));

console.log("scheduling tests passed", sameTimezone[0].start, noFullOverlap[0].insideWorkingHoursCount, dstEdge[0].localTimes[0].start);
