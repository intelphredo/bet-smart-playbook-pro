import { Match } from "@/types/sports";
import { format, parseISO } from "date-fns";

/**
 * Generate a CSV string from matches
 */
export function generateMatchesCSV(matches: Match[]): string {
  const headers = [
    "Date",
    "Time",
    "League",
    "Home Team",
    "Away Team",
    "Status",
    "Confidence",
    "SmartScore",
    "Recommended Pick",
    "Projected Home Score",
    "Projected Away Score",
    "Home Win Odds",
    "Away Win Odds",
  ];

  const rows = matches.map((match) => {
    const matchDate = parseISO(match.startTime);
    return [
      format(matchDate, "yyyy-MM-dd"),
      format(matchDate, "HH:mm"),
      match.league || "",
      match.homeTeam?.name || "",
      match.awayTeam?.name || "",
      match.status || "",
      match.prediction?.confidence?.toFixed(1) || "",
      match.smartScore?.overall?.toFixed(1) || "",
      match.prediction?.recommended || "",
      match.prediction?.projectedScore?.home?.toString() || "",
      match.prediction?.projectedScore?.away?.toString() || "",
      match.odds?.homeWin?.toFixed(2) || "",
      match.odds?.awayWin?.toFixed(2) || "",
    ];
  });

  // Escape CSV values
  const escapeCSV = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Generate an iCal string from matches
 */
export function generateMatchesICal(matches: Match[], calendarName = "BetSmart Games Schedule"): string {
  const formatICalDate = (date: Date): string => {
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  const escapeICalText = (text: string): string => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  };

  const generateUID = (match: Match): string => {
    return `${match.id}@betsmart.app`;
  };

  const events = matches.map((match) => {
    const startDate = parseISO(match.startTime);
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // 3 hours duration
    
    const summary = `${match.homeTeam?.name || "Home"} vs ${match.awayTeam?.name || "Away"}`;
    const description = [
      `League: ${match.league || "Unknown"}`,
      match.prediction?.confidence ? `Confidence: ${match.prediction.confidence.toFixed(1)}%` : "",
      match.smartScore?.overall ? `SmartScore: ${match.smartScore.overall.toFixed(1)}` : "",
      match.prediction?.recommended ? `Recommended: ${match.prediction.recommended}` : "",
      match.prediction?.projectedScore 
        ? `Projected Score: ${match.prediction.projectedScore.home} - ${match.prediction.projectedScore.away}` 
        : "",
    ].filter(Boolean).join("\\n");

    const location = match.league || "";

    return [
      "BEGIN:VEVENT",
      `UID:${generateUID(match)}`,
      `DTSTAMP:${formatICalDate(new Date())}`,
      `DTSTART:${formatICalDate(startDate)}`,
      `DTEND:${formatICalDate(endDate)}`,
      `SUMMARY:${escapeICalText(summary)}`,
      `DESCRIPTION:${escapeICalText(description)}`,
      location ? `LOCATION:${escapeICalText(location)}` : "",
      `CATEGORIES:${match.league || "SPORTS"}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
    ].filter(Boolean).join("\r\n");
  });

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BetSmart//Games Schedule//EN",
    `X-WR-CALNAME:${calendarName}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return calendar;
}

/**
 * Download a file with the given content
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export matches to CSV file
 */
export function exportMatchesToCSV(matches: Match[], filename = "games-schedule.csv"): void {
  const csv = generateMatchesCSV(matches);
  downloadFile(csv, filename, "text/csv;charset=utf-8");
}

/**
 * Export matches to iCal file
 */
export function exportMatchesToICal(matches: Match[], filename = "games-schedule.ics"): void {
  const ical = generateMatchesICal(matches);
  downloadFile(ical, filename, "text/calendar;charset=utf-8");
}