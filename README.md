# Hub Pro — Info Jeunes Pays de la Loire

Plateforme professionnelle du Réseau Info Jeunes PDL.

## Développement local

### 1. Prérequis

- Node.js 20+
- pnpm
- PostgreSQL (local ou via Docker)

### 2. Installation

```bash
pnpm install
```

### 3. Variables d'environnement

Copiez `.env.local.example` (ou créez `.env.local`) avec :

```env
DATABASE_URL=postgresql://localhost:5432/hub_pro_dev
AUTH_SECRET=your-secret-here        # générer avec: openssl rand -base64 32

# Resend (email d'invitation)
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=hub@info-jeunes-pdl.fr
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Base de données

```bash
# Créer la base
createdb hub_pro_dev

# Appliquer les migrations
DATABASE_URL=postgresql://localhost:5432/hub_pro_dev pnpm db:migrate

# Peupler avec les données de démo
DATABASE_URL=postgresql://localhost:5432/hub_pro_dev pnpm db:seed
```

### 5. Lancer l'application

```bash
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Comptes de démo

| Nom | Email | Mot de passe | Rôle |
|-----|-------|--------------|------|
| Alexandre Martin | alexandre.martin@ij-pdl.fr | password123 | Admin |
| Marie Leroy | marie.leroy@ij-nantes.fr | password123 | Salarié IJ |
| Thomas Dubois | thomas.dubois@ij-49.fr | password123 | Salarié IJ |
| Sophie Bernard | sophie.bernard@pij-85.fr | password123 | Pro Réseau |
| Sarah Lemoine | sarah.lemoine@crij-pdl.fr | password123 | Pro Réseau |
| Marc Durand | marc.durand@bij-laval.fr | password123 | Pro Réseau |
| Claire Petit | claire.petit@ml44.fr | password123 | Relais externe |
| Lucas Moreau | lucas.moreau@cidj.com | password123 | Relais externe |

## Scripts utiles

```bash
pnpm dev          # Serveur de développement
pnpm build        # Build de production
pnpm tsc          # Vérification TypeScript
pnpm lint         # Lint ESLint

pnpm db:generate  # Générer une migration Drizzle
pnpm db:migrate   # Appliquer les migrations
pnpm db:seed      # Peupler avec les données de démo
pnpm db:studio    # Ouvrir Drizzle Studio

pnpm test         # Tests unitaires (Vitest)
```

## Architecture

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) pour la documentation complète.
