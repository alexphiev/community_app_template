# Design System — « Lagune »
> Système de design pour application SaaS — thème **Teal & Corail**  
> Inspiré d'Infos Jeunes (teal `#00ACA4`, salmon `#FF6F6F`), **rendu conforme WCAG 2.2 AA**  
> Cible : web app professionnelle, accessible (AA strict), **mobile-first**, Next.js 15 · Tailwind v4 · shadcn/ui

---

## 0. Philosophie & principes

Cinq principes gouvernent toutes les décisions. En cas de conflit, ils priment dans cet ordre.

1. **Accessible par construction.** Chaque couleur de la palette passe WCAG AA dans son usage documenté. Il n'existe **aucune** couleur « décorative » qu'on s'interdirait d'utiliser : si une couleur ne passe pas, elle n'entre pas dans le système.
2. **Le teal structure, le corail ponctue.** Le teal porte la navigation, les actions primaires, l'ossature. Le corail souligne (CTA secondaire, accent) et ne dépasse jamais ~10 % de la surface colorée d'un écran.
3. **Calme par défaut.** Beaucoup de blanc, des neutres légèrement teintés, de la couleur seulement là où elle informe.
4. **Mobile-first, densité progressive.** On dessine à 360px puis on enrichit. Cibles tactiles jamais sous 44×44px.
5. **Le mouvement sert la compréhension** et se désactive proprement sous `prefers-reduced-motion`.

### Origine du choix chromatique (transparence)
Le teal de marque d'Infos Jeunes `#00ACA4` et le salmon `#FF6F6F` sont **lumineux mais non accessibles en texte ou en aplat sous du blanc** (≈ 2.8:1, voir §4). Plutôt que de bâtir des règles d'exception autour de couleurs cassées, on **ancre la palette sur des versions assombries qui conservent la teinte** : un teal `#00807A` et un corail `#BB4F3A` perceptivement proches des originaux, mais ≥ 4.5:1. Les originaux survivent uniquement comme **nuances claires de surface** (`teal-100`, `coral-100`) où le texte est sombre.

### Signature visuelle
- **Le « focus teal »** : anneau de focus 2px + 2px d'offset, identique partout.
- **Le filet corail** : barre d'accent 3px révélée à gauche des éléments actifs (jamais en aplat plein).
- **Le dégradé Lagune** : `teal-600 → teal-800`, réservé aux hero et états vides ; texte toujours blanc, posé sur l'extrémité foncée.
- **Neutres teintés** (hue 200–215) : l'interface paraît cohérente sans être colorée.

---

## 1. Architecture des tokens (3 niveaux)

Un composant ne référence **jamais** une couleur brute, seulement un token **sémantique**.

```
1. Primitives   →  teal-700, coral-700, neutral-100…   (valeurs brutes)
2. Sémantiques  →  --primary, --accent, --background…   (intention, indépendant du thème)
3. Composant    →  surcharges locales optionnelles
```
Changer de thème (clair/sombre) ou rebrander = ne toucher qu'à la couche 2.

---

## 2. Couleurs — Primitives (échelles oklch)

On utilise **oklch** (standard shadcn/Tailwind v4) : perceptuellement uniforme → échelles régulières à l'œil et dégradés propres.

### Teal — hue ≈ 185
| Token | oklch | ≈ hex | Contraste blanc | Rôle |
|------|-------|-------|-----------------|------|
| `teal-50`  | `oklch(0.971 0.020 185)` | `#E6F7F6` | — | surface très claire, hover |
| `teal-100` | `oklch(0.940 0.040 185)` | `#C6EEEB` | — | badge/surface (texte sombre) |
| `teal-200` | `oklch(0.890 0.060 185)` | `#9CDFDB` | — | bordures douces |
| `teal-300` | `oklch(0.820 0.085 185)` | `#62CCC6` | — | décor, illustrations |
| `teal-400` | `oklch(0.730 0.100 185)` | `#16B3AA` | 2.1:1 | décor large uniquement |
| `teal-500` | `oklch(0.640 0.100 185)` | `#009C93` | 3.4:1 | grands éléments, icônes ≥ 24px |
| `teal-600` | `oklch(0.560 0.095 186)` | `#00857D` | 4.3:1 | hover de primary |
| **`teal-700`** | `oklch(0.510 0.088 186)` | **`#00807A`** | **4.8:1 ✓ AA** | **PRIMARY** (fill + texte blanc) |
| `teal-800` | `oklch(0.430 0.075 187)` | `#0A6660` | 7.0:1 ✓ AAA | texte teal sur fond clair, hover |
| `teal-900` | `oklch(0.350 0.060 188)` | `#114F4A` | 9.6:1 | titres teintés |
| `teal-950` | `oklch(0.260 0.045 189)` | `#143631` | — | fonds sombres |

### Corail — hue ≈ 30 (légèrement chaud → distinct du rouge « danger »)
| Token | oklch | ≈ hex | Contraste blanc | Rôle |
|------|-------|-------|-----------------|------|
| `coral-50`  | `oklch(0.970 0.018 30)` | `#FDECE8` | — | surface alerte douce |
| `coral-100` | `oklch(0.935 0.035 30)` | `#FBD8CF` | — | badge accent (texte sombre) |
| `coral-200` | `oklch(0.880 0.065 30)` | `#F6B8AB` | — | bordures accent |
| `coral-300` | `oklch(0.810 0.100 30)` | `#F2917F` | — | décor |
| `coral-400` | `oklch(0.730 0.135 30)` | `#EC6C53` | 2.8:1 | décor large |
| `coral-500` | `oklch(0.650 0.150 30)` | `#DC543C` | 3.7:1 | grands éléments, icônes ≥ 24px |
| `coral-600` | `oklch(0.590 0.150 30)` | `#CB4A33` | 4.4:1 | hover d'accent |
| **`coral-700`** | `oklch(0.540 0.150 30)` | **`#BB4F3A`** | **4.9:1 ✓ AA** | **ACCENT** (fill + texte blanc) |
| `coral-800` | `oklch(0.470 0.130 30)` | `#A23A2A` | 6.4:1 ✓ AA+ | texte accent sur fond clair |
| `coral-900` | `oklch(0.400 0.105 30)` | `#852E20` | 8.5:1 | texte fort |
| `coral-950` | `oklch(0.300 0.075 30)` | `#5C2016` | — | fonds sombres |

### Neutres (gris teintés teal — hue ≈ 200–215)
| Token | oklch | ≈ hex |
|------|-------|-------|
| `neutral-0`   | `oklch(1 0 0)`           | `#FFFFFF` |
| `neutral-50`  | `oklch(0.985 0.003 200)` | `#FAFBFB` |
| `neutral-100` | `oklch(0.970 0.005 200)` | `#F2F4F4` |
| `neutral-200` | `oklch(0.930 0.006 200)` | `#E4E8E8` |
| `neutral-300` | `oklch(0.880 0.007 200)` | `#D2D8D8` |
| `neutral-400` | `oklch(0.710 0.009 200)` | `#9AA4A4` |
| `neutral-500` | `oklch(0.560 0.010 205)` | `#6B7676` |
| `neutral-600` | `oklch(0.450 0.011 205)` | `#525C5C` |
| `neutral-700` | `oklch(0.370 0.011 210)` | `#3D4646` |
| `neutral-800` | `oklch(0.270 0.010 215)` | `#272E2E` |
| `neutral-900` | `oklch(0.210 0.009 215)` | `#1A2020` |
| `neutral-950` | `oklch(0.150 0.008 220)` | `#101414` |

### Statut système (tous AA en texte blanc sur fill, ou texte foncé sur surface)
| Statut | Texte/fill `-700` | Surface `-50` | Hue | vs Accent |
|--------|-------------------|---------------|-----|-----------|
| Success | `oklch(0.52 0.13 155)` `#1E8A5F` (4.6:1) | `oklch(0.96 0.03 155)` | 155 vert | distinct |
| Warning | `oklch(0.55 0.12 75)` `#9A6B12` (4.7:1) | `oklch(0.96 0.04 85)` | 75 ambre | distinct |
| Danger  | `oklch(0.52 0.19 25)` `#C92A2E` (5.3:1) | `oklch(0.96 0.03 25)` | 25 rouge pur | hue 25 vs accent 30 + **icône obligatoire** |
| Info    | `oklch(0.52 0.11 245)` `#2C6BC0` (5.0:1) | `oklch(0.96 0.03 245)` | 245 bleu | distinct |

> Danger (rouge pur, hue 25) et Accent corail (chaud, hue 30) restent proches : le statut **danger porte toujours une icône** (§9, §11) — jamais distingué par la seule couleur.

---

## 3. Couleurs — Tokens sémantiques

### 3.1 Thème clair (défaut)
```
--background        = neutral-0
--surface           = neutral-0      /* cartes, panneaux */
--surface-subtle    = neutral-50     /* striping, zones alternées */
--surface-muted     = neutral-100    /* champs désactivés */
--foreground        = neutral-900    /* texte principal     14.5:1 ✓ AAA */
--foreground-muted  = neutral-600    /* texte secondaire     7.1:1 ✓ AAA */
--foreground-subtle = neutral-500    /* placeholders ≥14px   4.6:1 ✓ AA  */
--border            = neutral-200
--border-strong     = neutral-300    /* 3.0:1 — bordures porteuses d'info */
--input             = neutral-300

--primary           = teal-700       /* #00807A — blanc dessus 4.8:1 ✓ */
--primary-hover     = teal-800
--primary-foreground= neutral-0
--primary-surface   = teal-50        /* hover ghost, fond doux */

--accent            = coral-700       /* #BB4F3A — blanc dessus 4.9:1 ✓ */
--accent-hover      = coral-800
--accent-foreground = neutral-0
--accent-surface    = coral-50

--ring              = teal-600        /* anneau focus — 3:1 vs blanc ✓ */
--overlay           = oklch(0.21 0.009 215 / 0.55)
```

### 3.2 Thème sombre
On ne fait pas une simple inversion : on éclaircit primaire/accent (sinon illisibles) et on **baisse la chroma du texte** (un texte saturé vibre sur fond sombre).
```
--background        = neutral-950
--surface           = neutral-900
--surface-subtle    = neutral-800
--foreground        = neutral-100     /* 15:1 ✓ AAA */
--foreground-muted  = neutral-400     /* 6.8:1 ✓   */
--border            = oklch(1 0 0 / 0.10)
--border-strong     = oklch(1 0 0 / 0.18)

--primary           = teal-400        /* clair sur sombre */
--primary-foreground= neutral-950     /* texte sombre dessus 8:1 ✓ */
--accent            = coral-400
--accent-foreground = neutral-950
--ring              = teal-400
--overlay           = oklch(0 0 0 / 0.65)
```

---

## 4. Contraste — garanties (table de vérité, à respecter en revue)

**Toute** paire ci-dessous est conforme : il n'y a pas d'exception à mémoriser.

| Paire (light) | Ratio | Niveau | Usage |
|---------------|-------|--------|-------|
| foreground / background | 14.5:1 | AAA | tout texte |
| foreground-muted / background | 7.1:1 | AAA | texte secondaire |
| foreground-subtle / background | 4.6:1 | AA | captions, placeholders (≥14px) |
| primary-fg / primary | 4.8:1 | AA | texte de bouton primaire |
| accent-fg / accent | 4.9:1 | AA | texte de bouton accent |
| teal-800 / background | 7.0:1 | AAA | lien/texte teal sur blanc |
| coral-800 / background | 6.4:1 | AA+ | texte accent sur blanc |
| ring / background | 3.1:1 | AA non-texte | focus |
| border-strong / background | 3.0:1 | AA non-texte | bordures d'info |

**Pour mémoire — les couleurs sources, écartées du texte** :
| Source | vs blanc | Verdict |
|--------|----------|---------|
| `#00ACA4` (teal d'origine) | 2.83:1 | ❌ surface/décor uniquement |
| `#FF6F6F` (salmon d'origine) | 2.70:1 | ❌ surface/décor uniquement |

> Cibles WCAG : texte AA = 4.5:1 · texte large (≥18.66px bold / ≥24px) = 3:1 · composants & focus = 3:1.

---

## 5. Typographie

```
--font-sans:    "Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
--font-display: "Bricolage Grotesque", "Inter Variable", sans-serif;  /* titres hero */
--font-mono:    "JetBrains Mono", "SF Mono", ui-monospace, monospace;
```
*Inter* pour le corps (lisibilité écran, variable), *Bricolage Grotesque* en display pour le caractère. **Chiffres tabulaires** (`tabular-nums`) obligatoires dans tableaux et montants.

### Échelle modulaire — ratio 1.250 (titres), linéaire (corps)
| Token | rem | px | line-height | letter-spacing | usage |
|-------|-----|----|-----------|----------------|-------|
| `text-2xs` | 0.6875 | 11 | 1.45 | +0.01em | labels micro |
| `text-xs`  | 0.75 | 12 | 1.5 | +0.005em | métadonnées, badges |
| `text-sm`  | 0.875 | 14 | 1.5 | 0 | UI dense |
| `text-base`| 1.0 | 16 | 1.6 | 0 | **corps (jamais < 16px)** |
| `text-lg`  | 1.125 | 18 | 1.55 | 0 | lead |
| `text-xl`  | 1.25 | 20 | 1.45 | -0.005em | H4 |
| `text-2xl` | 1.5 | 24 | 1.35 | -0.01em | H3 |
| `text-3xl` | 1.953 | 31 | 1.25 | -0.015em | H2 |
| `text-4xl` | 2.441 | 39 | 1.15 | -0.02em | H1 |
| `text-5xl` | 3.052 | 49 | 1.1 | -0.025em | Hero |

Poids : titres `600–700`, corps `400`, emphase `500`. Longueur de ligne optimale **60–75ch**. Le `line-height` diminue quand la taille augmente.

---

## 6. Espacement, rayons, élévation

**Grille base 4px** : `0 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96`. Aucune valeur orpheline (13, 17…).

**Rayons** : `xs 4` (tags) · `sm 6` (inputs/boutons) · `md 10` (cartes/popovers) · `lg 14` (modales) · `xl 20` (bottom sheets) · `full 9999`.

**Élévation** — ombres teintées (hue 215), pas noires. En **dark mode l'élévation passe par la luminosité de surface**, pas l'ombre.
| Token | valeur (light) | layer |
|-------|----------------|-------|
| `shadow-xs` | `0 1px 2px oklch(0.21 0.01 215 / 0.06)` | repos |
| `shadow-sm` | `0 1px 3px /0.08, 0 1px 2px /0.06` | cartes |
| `shadow-md` | `0 4px 12px /0.10, 0 2px 4px /0.06` | dropdowns, hover |
| `shadow-lg` | `0 12px 28px /0.14, 0 4px 8px /0.08` | popovers |
| `shadow-xl` | `0 24px 48px /0.18` | modales |
| `shadow-focus` | `0 0 0 2px var(--background), 0 0 0 4px var(--ring)` | **focus universel** |

**Z-index nommés** : `dropdown 1000 · sticky 1100 · overlay 1200 · modal 1300 · popover 1400 · toast 1500 · tooltip 1600`.

---

## 7. Responsive & layout

**Breakpoints (mobile-first)** : base `0` (téléphone) · `sm 640` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536`.

**Container queries (Tailwind v4)** privilégiées sur les media queries pour les composants réutilisables (un composant s'adapte à *son conteneur*) — indispensable avec sidebars rétractables et panneaux redimensionnables.

**Largeurs** : `--container-prose: 75ch` · `--container-app: 1440px` · gutters 16px (mobile) / 24px (desktop).

**Tactile & densité** :
- Minimum **44×44px** (WCAG 2.2 *Target Size* 2.5.8) ; bouton icône mobile 48×48px.
- `--row-height` : 56px (mobile, confort) → 40px (desktop, densité) ; toggle « compact » sur les tables.
- Safe areas iOS : `padding-bottom: env(safe-area-inset-bottom)` sur barres fixes et bottom sheets.

**Shell type** : mobile = top bar 56px + bottom nav 64px (max 5 items) ou drawer ; desktop = sidebar rétractable 264/72px + top bar 64px.

---

## 8. Mouvement

```
--ease-out:    cubic-bezier(0.16, 1, 0.3, 1);     /* entrées */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);    /* déplacements */
--duration-fast: 120ms;  --duration-base: 200ms;  --duration-slow: 320ms;
```
On anime `transform`/`opacity` (GPU), jamais `width`/`height`/`top`. Ce qui apparaît utilise `ease-out`.

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
```
Les animations purement décoratives sont **supprimées** (pas raccourcies) ; seuls les changements d'état instantanés restent.

---

## 9. Composants — spécifications par état

6 états pour chaque composant interactif : `default · hover · active · focus-visible · disabled · loading`. Le focus utilise toujours `shadow-focus` (jamais `outline:none` sans remplacement ≥ 3:1).

### 9.1 Button
| Variante | Repos | Hover | Disabled |
|----------|-------|-------|----------|
| **Primary** | bg `primary` (teal-700), txt blanc | bg `primary-hover` | bg `neutral-200`, txt `neutral-400`, `not-allowed` |
| **Accent** | bg `accent` (coral-700), txt blanc | bg `accent-hover` | idem |
| **Secondary** | `surface` + bordure `border-strong` + txt `foreground` | bg `surface-subtle` | opacity douce |
| **Ghost** | transparent, txt `teal-800` | bg `primary-surface` | txt `neutral-400` |
| **Destructive** | bg `danger`, txt blanc + **icône** | danger −10% L | — |
| **Link** | txt `teal-800`, `underline underline-offset-2 decoration-2` | txt `teal-900` | — |

Tailles : `sm` h-36 · `md` h-40 · `lg` h-48 (défaut mobile). **Loading** : spinner + largeur conservée + `aria-busy`. Bouton icône seul → `aria-label` + 44px.

### 9.2 Input / Select / Textarea
Repos : `surface` + bordure `input`, placeholder `foreground-subtle`, h-40 (44 mobile). Focus : bordure `primary` + `shadow-focus`. **Erreur** : bordure `danger` + message sous le champ + `aria-invalid` + `aria-describedby` + **icône ⚠**. Label **toujours visible**. Requis : astérisque + `aria-required`. `font-size ≥ 16px` mobile (anti-zoom iOS).

### 9.3 Card
`surface` · bordure `border` · `radius-md` · `shadow-sm` · padding 24 (16 mobile). Hover si cliquable : `shadow-md` + `translateY(-2px)` + filet corail 3px à gauche. Carte cliquable = un lien englobant focusable avec `aria-label`.

### 9.4 Badge / Tag
`text-xs 600` · padding `2px 10px` · `radius-full`. Variantes : neutre, info, success, warning, danger, **brand** (`teal-100`/`teal-800`), **accent** (`coral-100`/`coral-800`). Statut = texte **+** point/icône.

### 9.5 Navigation
Item actif : filet corail 3px (gauche sidebar / bas topnav) + txt `foreground 600` + fond `primary-surface` + `aria-current="page"`. Repos : `foreground-muted` ; hover : `surface-subtle`. **Skip link** « Aller au contenu » en premier focusable. Sidebar réduite : libellé en tooltip, état persisté.

### 9.6 Modal / Dialog
Overlay `--overlay` + contenu `surface radius-lg shadow-xl` max-w 520 (centré desktop / **bottom sheet plein écran mobile**, draggable). **Focus trap** · `role="dialog"` `aria-modal` `aria-labelledby` · `Esc` ferme · focus rendu au déclencheur · scroll body verrouillé.

### 9.7 Toast
Haut-droit (desktop) / haut plein largeur (mobile, sous safe-area). `role="status"` (info/success) ou `role="alert"` (erreur). Auto-dismiss 5s **sauf erreurs**. Fermer 44px. Max 3 empilés. Statut = icône + couleur + texte.

### 9.8 Table
En-tête `surface-subtle` sticky · lignes h-48 · striping `surface-subtle` · `tabular-nums` (numérique aligné droite). Tri `aria-sort` + icône. Sélection checkbox 44px. **Mobile** : bascule en liste de cartes (pas de scroll horizontal sur données critiques).

### 9.9 Tabs
Onglet actif : filet corail + `foreground`. `role="tablist/tab/tabpanel"`, flèches ←/→, `aria-selected`. Mobile : scroll horizontal + masque de fondu aux bords.

### 9.10 États vides & chargement
Empty state : dégradé Lagune léger + titre + 1 phrase + 1 CTA. **Skeleton** (pas spinner) pour le contenu structuré ; shimmer respectant `reduced-motion`.

---

## 10. Iconographie & imagerie

- **lucide-react** (cohérent shadcn) : trait 1.5–2px, grille 24. Tailles 16 (inline) / 20 (UI) / 24 (nav). Décoratif → `aria-hidden` ; porteur de sens → `aria-label`.
- **Dégradé Lagune** (hero, empty states) — texte blanc posé sur l'extrémité foncée :
  ```css
  background: linear-gradient(145deg, var(--color-teal-600) 0%, var(--color-teal-800) 100%);
  ```
  Vérifier le contraste sur le point le plus clair (teal-600 + blanc = 4.3:1, donc texte ≥ 24px ou bold ; sinon ancrer le bloc de texte sur teal-700/800).
- Photos : duotone teal/neutre pour l'unité ; ratios `16:9`, `4:3`, `1:1`.

---

## 11. Accessibilité — checklist WCAG 2.2 AA

**Perceptible** — [ ] contraste ≥ 4.5:1 (3:1 large), garanti §4 · [ ] jamais d'info par la couleur seule *1.4.1* · [ ] reflow sans scroll horizontal à 320px / zoom 400% *1.4.10* · [ ] texte zoom 200% *1.4.4*.

**Utilisable** — [ ] tout au **clavier**, ordre logique *2.1.1* · [ ] `focus-visible` jamais supprimé sans alternative ≥ 3:1 *2.4.7 / 2.4.11* · [ ] cibles ≥ 24px (on impose 44) *2.5.8* · [ ] skip link, landmarks, un seul `<h1>`, hiérarchie continue *2.4.1* · [ ] focus trap **uniquement** dans les modales *2.1.2*.

**Compréhensible** — [ ] `<html lang="fr">` *3.1.1* · [ ] labels persistants, erreurs en texte + `aria-describedby` + suggestions *3.3.1–3.3.3* · [ ] aide cohérente au même endroit *3.2.6*.

**Robuste** — [ ] HTML valide, ARIA conforme au pattern APG, `aria-live` pour le dynamique *4.1.2 / 4.1.3* · [ ] testé VoiceOver + NVDA.

**Au-delà de AA** : navigation 100 % clavier, mode `forced-colors` (contraste forcé Windows), simulation daltonisme — teal (185) vs corail (30) restent séparés en *teinte*, et toute info porte aussi forme/texte.

---

## 12. Implémentation — Tailwind v4 + shadcn/ui (prêt à coller)

Nommage **aligné shadcn** (`--background`, `--primary`…) → les composants shadcn marchent sans réécriture.

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Primitives */
  --color-teal-50:  oklch(0.971 0.020 185);
  --color-teal-100: oklch(0.940 0.040 185);
  --color-teal-600: oklch(0.560 0.095 186);
  --color-teal-700: oklch(0.510 0.088 186); /* #00807A primary */
  --color-teal-800: oklch(0.430 0.075 187);
  --color-coral-50:  oklch(0.970 0.018 30);
  --color-coral-100: oklch(0.935 0.035 30);
  --color-coral-700: oklch(0.540 0.150 30); /* #BB4F3A accent */
  --color-coral-800: oklch(0.470 0.130 30);

  --font-sans: "Inter Variable", system-ui, sans-serif;
  --font-display: "Bricolage Grotesque", sans-serif;
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 14px;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.210 0.009 215);
  --card: oklch(1 0 0);
  --card-foreground: var(--foreground);
  --muted: oklch(0.970 0.005 200);
  --muted-foreground: oklch(0.450 0.011 205);
  --border: oklch(0.930 0.006 200);
  --input: oklch(0.880 0.007 200);

  --primary: oklch(0.510 0.088 186);            /* teal-700 — 4.8:1 ✓ */
  --primary-foreground: oklch(1 0 0);
  --accent: oklch(0.540 0.150 30);              /* coral-700 — 4.9:1 ✓ */
  --accent-foreground: oklch(1 0 0);
  --destructive: oklch(0.52 0.19 25);
  --destructive-foreground: oklch(1 0 0);
  --ring: oklch(0.560 0.095 186);               /* teal-600 — 3:1 ✓ */
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.150 0.008 220);
  --foreground: oklch(0.970 0.005 200);
  --card: oklch(0.210 0.009 215);
  --card-foreground: var(--foreground);
  --muted: oklch(0.270 0.010 215);
  --muted-foreground: oklch(0.710 0.009 200);
  --border: oklch(1 0 0 / 0.10);
  --input: oklch(1 0 0 / 0.14);
  --primary: oklch(0.730 0.100 185);            /* teal-400 */
  --primary-foreground: oklch(0.150 0.008 220);
  --accent: oklch(0.730 0.135 30);              /* coral-400 */
  --accent-foreground: oklch(0.150 0.008 220);
  --ring: oklch(0.730 0.100 185);
}

@layer base {
  :where(a, button, input, select, textarea, [tabindex]):focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--ring);
    border-radius: var(--radius-sm);
  }
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: .01ms !important;
      transition-duration: .01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

```ts
export type SemanticColor =
  | "background" | "foreground" | "card" | "muted" | "border" | "input"
  | "primary" | "accent" | "destructive" | "ring";
export type ButtonVariant =
  | "primary" | "accent" | "secondary" | "ghost" | "destructive" | "link";
export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";
```

---

## 13. Do & Don't (revue de design)

| ✅ Faire | ❌ Éviter |
|---------|-----------|
| Utiliser `primary`/`accent` tels quels — ils passent AA | Ressortir `#00ACA4`/`#FF6F6F` pour du texte ou un fill (échouent) |
| Corail en ponctuation (≤ 10 % surface) | Larges aplats corail |
| Statut = couleur **+** icône/texte (danger surtout) | Statut par la couleur seule |
| `focus-visible` partout, anneau 2+2px | `outline:none` sans remplacement |
| Espacements multiples de 4 | 13px, 17px, valeurs orphelines |
| Échelle oklch complète, tokens sémantiques | Couleurs en dur dans les composants |
| Cibles ≥ 44px | Boutons icône 32px mobile |
| Container queries pour composants | Tout en media queries fenêtre |
| Texte sur dégradé ancré sur teal-700/800 | Texte fin sur teal-500/600 |

---

*« Lagune » — système SaaS Teal & Corail, conforme WCAG 2.2 AA par construction. Next.js 15 · Tailwind v4 · shadcn/ui. Révision 3.0 — juin 2026.*
