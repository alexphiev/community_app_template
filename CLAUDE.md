# Project: Hub Pro (Info Jeunes POC)

## Documentation

### Architecture & modules
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — high-level architecture, tech stack, RBAC model, module list
- [docs/modules/README.md](docs/modules/README.md) — module index and development status
- [docs/modules/00-foundation.md](docs/modules/00-foundation.md) — auth, DB schema, base layout
- [docs/modules/01-resources.md](docs/modules/01-resources.md) — resource library (Boîte à outils)
- [docs/modules/02-news-agenda.md](docs/modules/02-news-agenda.md) — news & events feed
- [docs/modules/03-chat.md](docs/modules/03-chat.md) — internal messaging
- [docs/modules/04-directory-dashboard.md](docs/modules/04-directory-dashboard.md) — network directory & dashboard
- [docs/modules/05-admin.md](docs/modules/05-admin.md) — admin panel
- [docs/modules/06-etl.md](docs/modules/06-etl.md) — WordPress WXR migration / ETL
- [docs/modules/07-cross-cutting.md](docs/modules/07-cross-cutting.md) — cross-cutting concerns (notifications, search, i18n…)

### Implementation plans
Located in [docs/superpowers/plans/](docs/superpowers/plans/) — one file per module phase, named `YYYY-MM-DD-phase-N-<slug>.md`.

### Design system — Lagune
- [docs/stitch_hub_pro_design_system/design.md](docs/stitch_hub_pro_design_system/design.md) — full design system spec (colors, typography, components, WCAG AA rules). **Read this before writing any UI code.**
- [docs/stitch_hub_pro_design_system/lagune/DESIGN.md](docs/stitch_hub_pro_design_system/lagune/DESIGN.md) — Lagune theme token file (Material You format)
- [docs/stitch_hub_pro_design_system/infoblanc.svg](docs/stitch_hub_pro_design_system/infoblanc.svg) — brand logo

Each screen folder under `docs/stitch_hub_pro_design_system/` contains a `screen.png` (reference screenshot) and a `code.html` (annotated HTML mockup):
- `actualit_s/` — news feed
- `agenda_v_nements/` — events agenda
- `annuaire_du_r_seau/` — network directory
- `bo_te_outils/` — resource library
- `messagerie/` — messaging
- `tableau_de_bord/` — dashboard

**When building any screen:** check the matching `screen.png` + `code.html` first, then apply Lagune tokens from `design.md`.
