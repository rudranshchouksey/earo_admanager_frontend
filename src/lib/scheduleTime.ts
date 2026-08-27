/** Convert a calendar date + time in an IANA timezone to a UTC Date for comparisons. */
export function scheduleDateTimeInTimezone(
  date: string,
  time: string,
  timeZone: string,
): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  const targetMs = Date.UTC(year, month - 1, day, hour, minute);

  const zonedParts = (ms: number) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(new Date(ms));

    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((p) => p.type === type)?.value ?? 0);

    return {
      year: get("year"),
      month: get("month"),
      day: get("day"),
      hour: get("hour"),
      minute: get("minute"),
    };
  };

  for (let i = 0; i < 2; i++) {
    const z = zonedParts(utcMs);
    utcMs += targetMs - Date.UTC(z.year, z.month - 1, z.day, z.hour, z.minute);
  }

  return new Date(utcMs);
}

export function resolveScheduleTimezone(timezone?: string): string {
  return timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
