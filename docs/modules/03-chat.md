# Module 3 — Instant Messaging (Chat)

## What it does

The chat module replaces Discord as the real-time communication layer of the network. It addresses the core failure mode of Discord adoption: too much noise, no granular control, wrong tool for a professional network.

- **Three-pane layout** — a full-screen layout inspired by Slack/Teams: left pane (channel list), middle pane (message history + composer), right pane (channel details and notification preferences). The layout occupies the full viewport height, bypassing the standard page padding.
- **Channels** — thematic group conversations. The channel list is collapsible and grouped by section (Général, Groupes de travail, Messages directs). Active channel is highlighted with a coral 3px left border.
- **Messages** — messages display author avatar (initials or photo), name, timestamp, and body. An "(modifié)" label appears on edited messages. Messages alternate subtle background tints for readability.
- **Message composer** — a rich textarea with a formatting toolbar (bold, italic, strikethrough, link, list), emoji and mention buttons, and Enter-to-send (Shift+Enter for newline). The composer is always visible at the bottom of the message pane.
- **Polling-based updates** — the chat polls `GET /api/chat/messages?channelId=X&after=Y` every 3 seconds to fetch new messages since the last known ID. This avoids WebSocket infrastructure complexity for the MVP while remaining functionally equivalent for low-traffic channels.
- **Notification preferences** — each user can set a per-channel notification level (Toutes les alertes / Mentions seulement / Résumé quotidien / Muet) via a radio panel in the right pane. Settings are persisted to the DB immediately on change.

---

## MVP gaps & future improvements

### Real-time infrastructure

- **WebSockets** — replace polling with a WebSocket connection. The data model and API are already designed for this: `getMessages(channelId, after)` maps directly to a WS subscription. The recommended approach is Ably (managed, sovereign EU endpoint available), abstracting the transport behind a `lib/realtime.ts` interface so it can be swapped without touching UI code.
- **Presence** — show online/away/offline status for users in the channel member list and in DM conversations. Powered by Ably Presence or a Redis sorted set updated via heartbeat.
- **Typing indicators** — show "X est en train d'écrire..." when another user is composing a message in the current channel.
- **Read receipts** — track which messages each user has seen, enabling accurate unread counts per channel.
- **Unread badges** — the sidebar should show an unread count badge (red pill) on each channel with unread messages, and a total unread count on the "Messagerie" nav item in the global sidebar.

### Message features

- **File attachments** — attach PDFs, images, and other files from local disk or from the Resources library. Files go through the same S3 storage layer as resources.
- **Image preview** — inline image rendering in the message body (not download-only).
- **Message editing** — the `editedAt` column is in the schema but there is no edit action or UI. Users should be able to edit their own messages within a time window (e.g. 15 minutes).
- **Message deletion** — similarly, self-delete within a window, with moderator delete always available.
- **Message reactions** — emoji reactions on individual messages (not just top-level posts), shown as compact emoji stacks below the message.
- **Threaded replies** — reply to a specific message in a thread view (right pane or inline), keeping the main channel timeline clean.
- **Message search** — full-text search across the message history of channels the user is a member of.
- **Message pinning** — pin important messages within a channel for easy reference.
- **Bookmarks** — save messages to a personal reading list, accessible from the topbar.

### Direct messages

- **DM conversation creation** — the MVP has a `getDirectChannels` action but no UI to start a DM with another user. The "Messages directs" section in the channel list should include a "+" button that opens a user search and creates a direct channel between two users.
- **DM read receipts** — in 1-to-1 conversations, show double-check marks (sent / seen) as in WhatsApp/Signal.
- **Group DMs** — private conversations with more than 2 participants, outside the public channel structure.

### Notifications

- **Email digest** — for users with "Résumé quotidien" preference, a daily email summarising unread messages across all channels. Needs a cron job and an email sender (Brevo or self-hosted SMTP).
- **Push notifications** — Web Push API for in-browser notifications when a message arrives in a muted tab.
- **Mobile push** — for a future mobile app, push notifications via APNs/FCM.
- **Do Not Disturb** — a global "quiet hours" setting (e.g. no notifications between 20:00 and 08:00).

### Moderation and safety

- **Channel moderation** — admins should be able to delete any message, warn a user, and temporarily mute a user in a specific channel.
- **Message reporting** — flag a message for moderator review.
- **Channel member management** — add/remove members, assign channel admin roles, archive channels.
- **Message retention policy** — configure automatic deletion of messages older than N days per channel, for data minimisation.
