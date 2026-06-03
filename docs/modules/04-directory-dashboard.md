# Module 4 — Directory & Dashboard

## What it does

### Directory (Annuaire)

The annuaire is a searchable phonebook of all professionals in the Info Jeunes Pays de la Loire network:

- **Profile cards** — each card shows the user's avatar (initials if no photo), full name, structure (organisation), and role badge (teal for IJ staff, coral for Pro Réseau). A direct mailto link and phone link are surfaced on the card.
- **Search and filter bar** — a server-side form with a free-text query (name, structure), a role dropdown, and a Filtrer button. Filters are reflected in the URL query string so results are shareable.
- **Postgres search** — the `searchUsers` action uses `ilike` for case-insensitive partial matching across name, email, and structure.
- **Pagination** — 24 results per page.
- **Empty state** — friendly message when no professionals match the filters.

### Dashboard (Tableau de bord)

The dashboard is the personalised landing page shown after login. It aggregates information from all modules into a single overview:

- **Hero greeting** — "Bonjour [firstname]." in large Bricolage Grotesque, giving the page a warm, personal feel.
- **Quick-access bento cards** — 4 shortcut cards (Create a post, Toolbox, Agenda, Directory) with icons and short descriptions, each linking directly to the relevant section.
- **Recent news widget** — last 3 posts from the newsfeed, each with author initials and a preview of the body. Coral hover accent line.
- **Pinned resources carousel** — horizontally scrollable list of resources where `pinned = true`, allowing admins to surface important documents prominently.
- **Upcoming events widget** — next 3 events after today, each with a date chip (coral for internal events, teal for network events), time, and location.
- **Coral FAB** — a floating action button in the bottom-right corner linking to the news composer.

---

## MVP gaps & future improvements

### Directory

- **User profile page** — clicking "Voir le profil" on a card currently does nothing. Each user should have a dedicated profile page at `/directory/[userId]` showing their full bio, contact info, recent contributions (posts, resources), and a message button linking to the chat DM.
- **Profile self-editing** — users should be able to edit their own profile (name, structure, phone, bio, profile photo) from a `/settings/profile` page. Currently user data can only be changed by an admin.
- **Profile photo upload** — upload to S3 with automatic cropping/resizing to a square avatar format.
- **Online status indicator** — a green/grey dot on the avatar showing real-time presence (requires Redis + WebSocket layer from the chat module).
- **Departmental filtering** — the design shows a "Département" dropdown. The `users` table has no department field yet. Add a `department` column (or a separate `structures` table) and expose it as a filter.
- **vCard export** — a "Download contact" button that generates a `.vcf` file for adding the person to the user's phone contacts.
- **Organisation view** — browse by structure (CRIJ, BIJ, PIJ) rather than by individual, showing all staff of a given organisation grouped together.

### Dashboard

- **Role-differentiated widgets** — the MVP shows the same widgets to all roles. The full version should show different content based on role:
  - **Admin** — active user count, content awaiting moderation, recent signups, most-consulted resources.
  - **Salarié** — their own recent posts, pending approval for resources they submitted, events they're attending.
  - **Pro Réseau** — status of their pending resource submissions, upcoming events they're RSVPed to, new resources in their interest tags.
  - **Relais Externe** — limited view: only recent published resources and upcoming public events.
- **Activity feed personalisation** — filter the news widget to show only posts from colleagues the user follows or from their department.
- **Notification centre** — a unified notifications dropdown (bell icon in the topbar) showing @mentions, new comments on owned resources, moderation decisions, event reminders. Currently the bell is decorative.
- **Widget customisation** — let users reorder, hide, or resize dashboard widgets to match their personal workflow.
- **Quick stats for admins** — a compact KPI strip at the top (total users, resources published this month, events this week, unread moderation items) visible only to admins.
- **"Continue where you left off"** — resume the last-viewed resource, channel, or event. Requires storing last-visited state per user (in Redis or the DB).
