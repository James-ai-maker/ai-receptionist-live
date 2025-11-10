import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:3000/oauth2callback"
  );
}

export function addEvent(auth, summary, start, end) {
  const calendar = google.calendar({ version: "v3", auth });
  return calendar.events.insert({
    calendarId: "primary",
    resource: {
      summary,
      start: { dateTime: start },
      end: { dateTime: end },
    },
  });
}
