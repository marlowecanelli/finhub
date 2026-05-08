import type { CalendarEvent } from "./types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIcsDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escape(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/[\\;,]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
}

export function buildIcs(events: CalendarEvent[], calendarName = "FinHub"): string {
  const now = toIcsDate(new Date().toISOString());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FinHub//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escape(calendarName)}`,
    `X-WR-TIMEZONE:America/New_York`,
  ];

  for (const e of events) {
    const start = toIcsDate(e.event_date);
    // Default 30-min duration for time-bound events.
    const endIso = new Date(new Date(e.event_date).getTime() + 30 * 60 * 1000).toISOString();
    const end = toIcsDate(endIso);
    const ticker = e.ticker ? `[${e.ticker}] ` : "";
    lines.push(
      "BEGIN:VEVENT",
      `UID:finhub-${e.id}@finhub.app`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escape(ticker + e.title)}`,
      `DESCRIPTION:${escape(e.description ?? "")}`,
      `CATEGORIES:${e.event_type.toUpperCase()}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
