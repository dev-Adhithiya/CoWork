export interface BusyRange {
  start: string;
  end: string;
}

export interface SchedulingParticipant {
  userId: string;
  timezone: string;
  workingHours: { start: string; end: string };
  busyRanges: BusyRange[];
}

export interface CandidateSlot {
  start: string;
  end: string;
  insideWorkingHoursCount: number;
  totalOffHoursMinutes: number;
  localTimes: Array<{ userId: string; timezone: string; start: string; end: string; insideWorkingHours: boolean }>;
}

function minutesOfDay(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function localParts(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function isBusy(startMs: number, endMs: number, busyRanges: BusyRange[]) {
  return busyRanges.some((range) => startMs < Date.parse(range.end) && endMs > Date.parse(range.start));
}

function offHoursMinutes(startMinute: number, endMinute: number, workingStart: number, workingEnd: number, duration: number) {
  if (endMinute < startMinute) return duration;
  const overlap = Math.max(0, Math.min(endMinute, workingEnd) - Math.max(startMinute, workingStart));
  return Math.max(0, duration - overlap);
}

export function findCandidateMeetingSlots(
  participants: SchedulingParticipant[],
  durationMinutes: number,
  options: { searchStart?: string; days?: number; stepMinutes?: number } = {}
): CandidateSlot[] {
  if (!participants.length || durationMinutes <= 0) return [];
  const stepMinutes = options.stepMinutes || 30;
  const days = options.days || 7;
  const startMs = options.searchStart ? Date.parse(options.searchStart) : Date.now();
  const alignedStart = Math.ceil(startMs / (stepMinutes * 60000)) * stepMinutes * 60000;
  const endSearch = alignedStart + days * 24 * 60 * 60000;
  const candidates: CandidateSlot[] = [];

  for (let slotStart = alignedStart; slotStart + durationMinutes * 60000 <= endSearch; slotStart += stepMinutes * 60000) {
    const slotEnd = slotStart + durationMinutes * 60000;
    const localTimes: CandidateSlot["localTimes"] = [];
    let insideWorkingHoursCount = 0;
    let totalOffHoursMinutes = 0;
    let blockedByBusy = false;

    for (const participant of participants) {
      if (isBusy(slotStart, slotEnd, participant.busyRanges)) {
        blockedByBusy = true;
        break;
      }
      const localStart = localParts(new Date(slotStart), participant.timezone);
      const localEnd = localParts(new Date(slotEnd), participant.timezone);
      const workingStart = minutesOfDay(participant.workingHours.start);
      const workingEnd = minutesOfDay(participant.workingHours.end);
      const inside = localStart.date === localEnd.date && localStart.minutes >= workingStart && localEnd.minutes <= workingEnd;
      if (inside) insideWorkingHoursCount += 1;
      const offMinutes = inside ? 0 : offHoursMinutes(localStart.minutes, localEnd.minutes, workingStart, workingEnd, durationMinutes);
      totalOffHoursMinutes += offMinutes;
      localTimes.push({ userId: participant.userId, timezone: participant.timezone, start: `${localStart.date} ${localStart.time}`, end: `${localEnd.date} ${localEnd.time}`, insideWorkingHours: inside });
    }

    if (!blockedByBusy) {
      candidates.push({
        start: new Date(slotStart).toISOString(),
        end: new Date(slotEnd).toISOString(),
        insideWorkingHoursCount,
        totalOffHoursMinutes,
        localTimes,
      });
    }
  }

  return candidates
    .sort((a, b) => b.insideWorkingHoursCount - a.insideWorkingHoursCount || a.totalOffHoursMinutes - b.totalOffHoursMinutes || a.start.localeCompare(b.start))
    .slice(0, 20);
}
