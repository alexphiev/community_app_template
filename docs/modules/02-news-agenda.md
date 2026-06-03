# Module 2 — News & Agenda

## What it does

### Newsfeed (Actualités)

The newsfeed is the primary communication channel of the network, replacing the Discord general channel and informal email chains. It works like an internal social feed:

- **Posts** — any authenticated user (except Relais Externe) can write a post. Posts are plain text with a future-ready body field.
- **Reactions** — users can react to posts with an emoji (👍 by default). The reaction count is visible on each post card.
- **Comments** — threaded replies to posts, supporting nested conversations.
- **Pinned posts** — Admin/Salarié can pin a post so it appears at the top of the feed, highlighted as "À la une" with a coral accent.
- **Moderation** — Admin/Salarié can delete any post or comment; other roles can only delete their own.
- **ISR caching** — the news page is revalidated every 60 seconds, balancing freshness with server load.

### Agenda (Calendar)

The agenda centralises all network events in a visual monthly calendar:

- **Monthly grid** — a 7-column CSS grid showing the full month with event chips. Each chip is colour-coded by category (Formation=blue, Réunion=green, Événement=purple, Autre=grey) with a left border accent.
- **Today highlighting** — the current day cell is subtly tinted in teal.
- **Month navigation** — prev/next month links update the year/month query params.
- **RSVP** — users can toggle their attendance on an event; RSVPs are stored as a join table.
- **iCal export** — `GET /api/events/ical` returns a `.ics` file containing all events, compatible with Google Calendar, Outlook, and Apple Calendar.
- **Future OpenAgenda sync** — the `open_agenda_id` column is reserved for future sync with the OpenAgenda API used by many IJ structures.

---

## MVP gaps & future improvements

### Newsfeed

- **Rich text posts** — currently posts are plain text. A full-featured feed needs inline formatting (bold, links, bullet points), image attachments, and PDF attachments (reusing the resource storage layer).
- **@mentions** — tagging a colleague with `@name` should trigger a targeted notification and highlight the mention in the post body.
- **#hashtags** — links posts to tags in the taxonomy system, making the feed filterable by theme.
- **Post scheduling** — Admin/Salarié should be able to draft a post and schedule it to publish at a specific date/time (useful for coordinated national communications).
- **Drafts** — save a post as a draft before publishing, with a personal draft list.
- **Scroll-based pagination** — the current feed loads 20 posts at a time. Infinite scroll (Intersection Observer) would give a more natural feed experience.
- **Feed filtering** — filter by author, date range, category, or tag. The right sidebar in the design shows "Flux National / Régional / Départemental" toggles that are not yet wired.
- **Pinned posts section** — pinned posts should be visually separated from the chronological feed, not just sorted to the top.
- **Unread indicator** — show a badge when there are new posts since the user's last visit.
- **Post reporting** — users should be able to flag a post as inappropriate, triggering a moderation review. Currently only deletion by moderators is supported.

### Agenda

- **Event detail drawer** — the design shows a right-side drawer with full event details (title, date/time, location, description, participants list). Currently clicking an event on the calendar does nothing.
- **Week view** — the design includes a Mois/Semaine/Liste toggle. The week view (7 columns, 24-hour time slots) and list view are not implemented.
- **RSVP UI** — the `toggleRsvp` action exists but there is no button on the calendar or detail page to trigger it. The participant count is not displayed.
- **External Google Form linking** — the `externalFormUrl` field on events supports linking to an external registration form, but there is no UI to display or follow this link.
- **OpenAgenda sync** — implement a cron job or webhook that pulls events from the OpenAgenda API for structures that already manage their events there, syncing via the `openAgendaId` column.
- **Email reminders** — send an automated reminder email 24 hours before an event to all RSVPed participants.
- **Recurring events** — support weekly, monthly, or custom recurrence patterns (e.g. "every first Monday of the month").
- **Event categories management** — the `event_category` enum is hardcoded in the DB. Categories should be manageable from the Admin taxonomy panel.
- **iCal per-user feed** — generate a personalised `.ics` feed URL per user containing only events they've RSVPed to, for subscription in their personal calendar app.
- **Map integration** — for in-person events with a `location`, embed a map link (OpenStreetMap, sovereign alternative to Google Maps).
