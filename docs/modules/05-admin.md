# Module 5 — Administration Panel

## What it does

The admin panel (`/admin/*`) is accessible only to the `admin_ij_pdl` role and provides four management sections:

### User Management (`/admin/users`)

A paginated table of all registered users showing name, email, role badge, structure, and active/suspended status. Per-user inline actions:

- **Suspend / Unsuspend** — toggle the `suspended` flag. Suspended users are immediately blocked from the platform (middleware checks the flag via the JWT role, and the DB query excludes suspended users from directory results). Admins cannot suspend themselves.
- **Role assignment** — dropdown to change a user's role. Validated against the `ROLES` constant to prevent invalid values.

### Moderation Queue (`/admin/moderation`)

A queue of all resources with `status = pending_approval`, submitted by `pro_reseau_ij` members. For each pending item:

- **Approve** — sets status to `published` and records `approvedById`. The `revalidateTag` call ensures the resource appears in the relevant listing page immediately.
- **Reject** — deletes the resource. Currently there is no rejection reason or notification.

### Taxonomy (`/admin/taxonomy`)

A CRUD interface for the global tag vocabulary used across resources, posts, and events:

- **Create** — form with a name field; the slug is auto-generated from the name.
- **Delete** — removes the tag and all its associations via cascade FK.
- Existing tags are displayed as pill chips with an inline delete button.

### Analytics (`/admin/analytics`)

Three aggregate KPI cards:

- **Active users** — count of non-suspended users.
- **Published resources** — count of resources with `status = published`.
- **Published posts** — total post count.

A placeholder section acknowledges that detailed charts are deferred to a future iteration.

---

## MVP gaps & future improvements

### User management

- **User creation / invitation flow** — admins can currently only suspend or change roles for existing users. There is no flow to create a new account or send an invitation. A proper invitation system generates a one-time token link, emails it to the recipient, and pre-fills their role on first login.
- **Bulk actions** — select multiple users and apply suspend/unsuspend or role change in a single operation.
- **User detail page** — click a user row to see their full profile, activity log (posts written, resources submitted, events attended), and a list of their active sessions.
- **Suspension messaging** — when suspending a user, allow the admin to write a reason and optionally send an email notification to the user.
- **Account deactivation vs deletion** — GDPR Article 17 (right to erasure) requires a full data deletion flow. Currently suspension only blocks access; full deletion with anonymisation of historical content is not implemented.
- **User search and filtering** — the users table has no search or filter controls. For networks with hundreds of members, finding a specific user requires scrolling.

### Moderation queue

- **Rejection with reason** — when rejecting a resource, the admin should be able to write a short explanation that is sent to the submitter by email or in-app notification.
- **Moderation by Salarié** — the architecture spec grants moderation rights to `salarie_ij_pdl` as well, but the moderation page currently checks only for `admin_ij_pdl`. This should be opened to both roles.
- **Comment moderation** — the queue currently shows only resources pending approval. A separate tab (or unified queue) should surface reported/flagged comments and posts.
- **Moderation history** — a log of all moderation actions (approved/rejected, by whom, when) for accountability.

### Taxonomy

- **Tag merging** — merge tag A into tag B: reassign all content from A to B, then delete A. Essential for cleaning up duplicate or near-duplicate tags after migration from WordPress.
- **Tag usage counts** — show how many resources and posts use each tag, to identify orphaned or overused tags.
- **Hierarchical categories** — a parent-child tag structure (e.g. "Emploi" → "Apprentissage", "Alternance") for richer filtering.
- **Event categories management** — currently `event_category` is a hardcoded DB enum. It should be manageable from this panel.

### Analytics

- **Usage over time charts** — line charts showing active users per day/week, new resources per month, posts per week. Requires either a time-series table or a BI-ready query layer.
- **Most-consulted resources** — requires the `viewCount` field to actually be incremented (currently it's in the schema but never written). Top-10 list by view count.
- **FEDER adoption metrics** — specific KPIs required by the FEDER grant: percentage of eligible staff registered, monthly active user rate, content contribution rate per structure. These need to be defined with the project owner and implemented as dedicated queries.
- **Export to CSV/Excel** — ability to export user lists, content counts, and event attendance for reporting to FEDER.
- **Email campaign stats** — if email digests are implemented, open rates and click-through rates per digest edition.
- **Data retention dashboard** — show how much storage is used per module (resources S3, DB size), to inform cleanup and scaling decisions.
