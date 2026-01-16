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
export function generateMatchesICal(matches: Match[], calendarName = "EdgeIQ Games Schedule"): string {
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
    return `${match.id}@edgeiq.app`;
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
    "PRODID:-//EdgeIQ//Games Schedule//EN",
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

/**
 * Generate a Google Calendar URL for a single match
 */
export function generateGoogleCalendarUrl(match: Match): string {
  const startDate = parseISO(match.startTime);
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // 3 hours

  const formatGoogleDate = (date: Date): string => {
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  const title = `${match.homeTeam?.name || "Home"} vs ${match.awayTeam?.name || "Away"}`;
  const details = [
    `League: ${match.league || "Unknown"}`,
    match.prediction?.confidence ? `Confidence: ${match.prediction.confidence.toFixed(1)}%` : "",
    match.smartScore?.overall ? `SmartScore: ${match.smartScore.overall.toFixed(1)}` : "",
    match.prediction?.recommended ? `Recommended Pick: ${match.prediction.recommended}` : "",
    match.prediction?.projectedScore
      ? `Projected Score: ${match.prediction.projectedScore.home} - ${match.prediction.projectedScore.away}`
      : "",
    "",
    "Added via EdgeIQ",
  ].filter(Boolean).join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    details: details,
    location: match.league || "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate an Outlook Calendar URL for a single match
 */
export function generateOutlookCalendarUrl(match: Match): string {
  const startDate = parseISO(match.startTime);
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // 3 hours

  const title = `${match.homeTeam?.name || "Home"} vs ${match.awayTeam?.name || "Away"}`;
  const details = [
    `League: ${match.league || "Unknown"}`,
    match.prediction?.confidence ? `Confidence: ${match.prediction.confidence.toFixed(1)}%` : "",
    match.smartScore?.overall ? `SmartScore: ${match.smartScore.overall.toFixed(1)}` : "",
    match.prediction?.recommended ? `Recommended Pick: ${match.prediction.recommended}` : "",
    match.prediction?.projectedScore
      ? `Projected Score: ${match.prediction.projectedScore.home} - ${match.prediction.projectedScore.away}`
      : "",
    "",
    "Added via EdgeIQ",
  ].filter(Boolean).join("\n");

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: details,
    location: match.league || "",
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Open Google Calendar with multiple events (opens first event, shows count)
 * For multiple events, we create a summary event
 */
export function openGoogleCalendarBulk(matches: Match[]): void {
  if (matches.length === 0) return;

  if (matches.length === 1) {
    window.open(generateGoogleCalendarUrl(matches[0]), "_blank");
    return;
  }

  // For multiple matches, create a summary event with all games
  const firstMatch = matches[0];
  const lastMatch = matches[matches.length - 1];
  const startDate = parseISO(firstMatch.startTime);
  const endDate = parseISO(lastMatch.startTime);
  endDate.setHours(endDate.getHours() + 3);

  const formatGoogleDate = (date: Date): string => {
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  const gamesList = matches
    .slice(0, 10) // Limit to first 10 for URL length
    .map((m) => {
      const time = format(parseISO(m.startTime), "MMM d h:mm a");
      return `• ${m.homeTeam?.shortName} vs ${m.awayTeam?.shortName} (${time})`;
    })
    .join("\n");

  const details = [
    `${matches.length} Games Scheduled`,
    "",
    gamesList,
    matches.length > 10 ? `\n...and ${matches.length - 10} more games` : "",
    "",
    "View full schedule at EdgeIQ",
  ].filter(Boolean).join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `EdgeIQ: ${matches.length} Games This Week`,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    details: details,
  });

  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank");
}

/**
 * Open Outlook Calendar with multiple events
 */
export function openOutlookCalendarBulk(matches: Match[]): void {
  if (matches.length === 0) return;

  if (matches.length === 1) {
    window.open(generateOutlookCalendarUrl(matches[0]), "_blank");
    return;
  }

  // For multiple matches, create a summary event
  const firstMatch = matches[0];
  const lastMatch = matches[matches.length - 1];
  const startDate = parseISO(firstMatch.startTime);
  const endDate = parseISO(lastMatch.startTime);
  endDate.setHours(endDate.getHours() + 3);

  const gamesList = matches
    .slice(0, 10)
    .map((m) => {
      const time = format(parseISO(m.startTime), "MMM d h:mm a");
      return `• ${m.homeTeam?.shortName} vs ${m.awayTeam?.shortName} (${time})`;
    })
    .join("\n");

  const details = [
    `${matches.length} Games Scheduled`,
    "",
    gamesList,
    matches.length > 10 ? `\n...and ${matches.length - 10} more games` : "",
    "",
    "View full schedule at EdgeIQ",
  ].filter(Boolean).join("\n");

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: `EdgeIQ: ${matches.length} Games This Week`,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: details,
  });

  window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`, "_blank");
}