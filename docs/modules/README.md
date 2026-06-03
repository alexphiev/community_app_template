# Hub Pro — Module Documentation Index

This directory documents each module of the Hub Pro MVP: what it does today and what a fully-featured professional version would look like.

These documents are the primary backlog for the next development cycle. Each improvement listed is a standalone unit of work that can be prioritised, estimated, and assigned independently.

---

| # | Module | Status | Doc |
|---|---|---|---|
| 0 | Foundation & Infrastructure | ✅ MVP | [00-foundation.md](00-foundation.md) |
| 1 | Resources (Documentation, Toolbox, Veille, Tutorials) | ✅ MVP | [01-resources.md](01-resources.md) |
| 2 | News & Agenda | ✅ MVP | [02-news-agenda.md](02-news-agenda.md) |
| 3 | Instant Messaging (Chat) | ✅ MVP | [03-chat.md](03-chat.md) |
| 4 | Directory & Dashboard | ✅ MVP | [04-directory-dashboard.md](04-directory-dashboard.md) |
| 5 | Administration Panel | ✅ MVP | [05-admin.md](05-admin.md) |
| 6 | ETL Migration (WordPress) | ✅ MVP | [06-etl.md](06-etl.md) |
| 7 | Cross-Cutting Concerns | — | [07-cross-cutting.md](07-cross-cutting.md) |

---

## How to use these documents

**For sprint planning:** each "future improvement" bullet is a candidate user story. Break it into tasks, estimate, and schedule.

**For prioritisation:** some improvements unlock others (e.g. Redis must come before WebSocket chat, which must come before presence, which must come before DM read receipts). The cross-cutting doc notes these dependencies.

**For the FEDER deadline:** the critical path to production-readiness is:
1. Real passwords + invitation flow (Foundation)
2. Full-text resource search (Resources)
3. Notification centre (Cross-cutting)
4. WebSocket chat (Chat)
5. RGAA audit and fixes (Cross-cutting)
6. CI/CD pipeline + staging environment (Cross-cutting)
7. FEDER analytics metrics (Admin)
