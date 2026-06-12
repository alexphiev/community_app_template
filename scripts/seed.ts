/**
 * Demo seed — clears and re-inserts all data.
 * Run: DATABASE_URL=postgresql://localhost:5432/hub_pro_dev tsx scripts/seed.ts
 *
 * All users get password: password123
 * Admin login: alexandre.martin@ij-pdl.fr / password123
 */
import { config } from "dotenv"
config({ path: ".env" })

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
// @ts-expect-error drizzle-orm sql tag not resolved under bundler moduleResolution
import { sql } from "drizzle-orm";
import * as schema from "../db/schema";
import { hash } from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";

const neonClient = neon(process.env.DATABASE_URL!);
const db = drizzle(neonClient, { schema });

const PASSWORD = "password123";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function daysAgo(days: number): Date {
  return daysFromNow(-days);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

// ─── Clear ────────────────────────────────────────────────────────────────────

async function clearAll() {
  // Order matters — FK constraints
  await db.execute(sql`TRUNCATE TABLE
    notification_prefs,
    chat_messages,
    channel_members,
    channels,
    event_rsvps,
    events,
    post_reactions,
    post_comments,
    posts,
    resource_tags,
    resource_files,
    "comments",
    share_links,
    resources,
    tags,
    invite_tokens,
    "verificationToken",
    session,
    account,
    "user"
    CASCADE`);
  console.log("✓ Tables cleared");
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  const passwordHash = await hash(PASSWORD, 12);
  const now = new Date();

  // ── Users ──────────────────────────────────────────────────────────────────

  const userDefs = [
    {
      name: "Alexandre Martin",
      email: "alexandre.martin@ij-pdl.fr",
      role: "admin_ij_pdl" as const,
      structure: "IJ Pays de la Loire",
      phone: "02 40 00 00 01",
    },
    {
      name: "Marie Leroy",
      email: "marie.leroy@ij-nantes.fr",
      role: "salarie_ij_pdl" as const,
      structure: "IJ Nantes Métropole",
      phone: "02 40 00 00 02",
    },
    {
      name: "Thomas Dubois",
      email: "thomas.dubois@ij-49.fr",
      role: "salarie_ij_pdl" as const,
      structure: "IJ Maine-et-Loire",
      phone: "02 41 00 00 03",
    },
    {
      name: "Sophie Bernard",
      email: "sophie.bernard@pij-85.fr",
      role: "pro_reseau_ij" as const,
      structure: "PIJ La Roche-sur-Yon",
      phone: "02 51 00 00 04",
    },
    {
      name: "Sarah Lemoine",
      email: "sarah.lemoine@crij-pdl.fr",
      role: "pro_reseau_ij" as const,
      structure: "CRIJ Pays de la Loire",
      phone: "02 40 00 00 05",
    },
    {
      name: "Marc Durand",
      email: "marc.durand@bij-laval.fr",
      role: "pro_reseau_ij" as const,
      structure: "BIJ Laval",
      phone: "02 43 00 00 06",
    },
    {
      name: "Claire Petit",
      email: "claire.petit@ml44.fr",
      role: "relais_externe" as const,
      structure: "Mission Locale 44",
      phone: "02 40 00 00 07",
    },
    {
      name: "Lucas Moreau",
      email: "lucas.moreau@cidj.com",
      role: "relais_externe" as const,
      structure: "CIDJ Paris",
      phone: "01 44 49 12 00",
    },
  ];

  const userIds: Record<string, string> = {};
  for (const u of userDefs) {
    const id = createId();
    userIds[u.email] = id;
    await db.insert(schema.users).values({
      id,
      name: u.name,
      email: u.email,
      role: u.role,
      structure: u.structure,
      phone: u.phone,
      passwordHash,
      emailVerified: now,
      suspended: false,
    });
  }
  console.log(`✓ ${userDefs.length} users`);

  const adminId = userIds["alexandre.martin@ij-pdl.fr"];
  const marieId = userIds["marie.leroy@ij-nantes.fr"];
  const thomasId = userIds["thomas.dubois@ij-49.fr"];
  const sophieId = userIds["sophie.bernard@pij-85.fr"];
  const sarahId = userIds["sarah.lemoine@crij-pdl.fr"];
  const marcId = userIds["marc.durand@bij-laval.fr"];

  // ── Tags ───────────────────────────────────────────────────────────────────

  const tagDefs = [
    { name: "Subventions", slug: "subventions" },
    { name: "Orientation", slug: "orientation" },
    { name: "Formation", slug: "formation" },
    { name: "Saisonnier", slug: "saisonnier" },
    { name: "Mobilité européenne", slug: "mobilite-europeenne" },
    { name: "Numérique", slug: "numerique" },
  ];

  const tagIds: Record<string, string> = {};
  for (const t of tagDefs) {
    const id = createId();
    tagIds[t.slug] = id;
    await db.insert(schema.tags).values({ id, name: t.name, slug: t.slug });
  }
  console.log(`✓ ${tagDefs.length} tags`);

  // ── Resources ──────────────────────────────────────────────────────────────

  const resourceDefs: {
    title: string;
    description: string;
    type: "documentation" | "toolbox" | "veille" | "tutorial";
    status: "published";
    pinned: boolean;
    authorId: string;
    tags: string[];
    body?: string;
  }[] = [
    {
      title: "Charte Graphique Hub Pro 2024",
      description:
        "Guide complet des éléments visuels, couleurs, typographies et règles d'usage de la marque Info Jeunes PDL.",
      type: "documentation",
      status: "published",
      pinned: true,
      authorId: adminId,
      tags: ["numerique"],
      body: "Ce document présente l'identité visuelle complète du réseau Info Jeunes Pays de la Loire. Il inclut les palettes de couleurs Lagune, les règles typographiques (Bricolage Grotesque et Inter), les gabarits de communication et les règles d'accessibilité WCAG AA.",
    },
    {
      title: "Guide des Dispositifs Régionaux 2024",
      description:
        "Nouveaux barèmes et dates clés pour les dépôts de dossiers de subvention. Mis à jour pour l'exercice 2024.",
      type: "documentation",
      status: "published",
      pinned: true,
      authorId: sarahId,
      tags: ["subventions", "orientation"],
      body: "Ce guide recense l'ensemble des dispositifs d'accompagnement régionaux disponibles pour les jeunes de 16 à 25 ans en Pays de la Loire. Il détaille les critères d'éligibilité, les montants maximum et les procédures de dépôt de dossier.",
    },
    {
      title: "Kit Communication « Job d'Été 2024 »",
      description:
        "Pack complet : affiches, visuels réseaux sociaux, modèles email et guide de déploiement local pour la campagne estivale.",
      type: "toolbox",
      status: "published",
      pinned: false,
      authorId: marieId,
      tags: ["saisonnier", "numerique"],
      body: "Le kit Job d'Été 2024 contient tous les éléments nécessaires pour déployer la campagne sur votre territoire : 3 formats d'affiche (A3, A4, A5), 6 visuels adaptés aux réseaux sociaux, 2 modèles d'email et un guide d'animation d'événement.",
    },
    {
      title: "Tutoriel Saisie d'Activité Trimestrielle",
      description:
        "Vidéo pas-à-pas pour remplir le formulaire de rapport d'activité dans Hub Pro. Durée : 8 minutes.",
      type: "toolbox",
      status: "published",
      pinned: false,
      authorId: adminId,
      tags: ["numerique"],
      body: "Ce tutoriel vidéo guide les conseillers à travers les étapes de saisie du rapport d'activité trimestriel. Il couvre : la connexion à Hub Pro, la navigation vers le module Rapports, la saisie des statistiques d'accueil et la validation du formulaire.",
    },
    {
      title: "Réforme de l'Apprentissage : Note de Veille",
      description:
        "Analyse des impacts de la réforme 2023-2024 sur les dispositifs d'orientation pour les 15-25 ans.",
      type: "veille",
      status: "published",
      pinned: false,
      authorId: sarahId,
      tags: ["orientation", "formation"],
      body: "La réforme de l'apprentissage introduit plusieurs changements majeurs impactant les structures IJ : nouvelles modalités de financement des formations, évolution du contrat d'apprentissage, rôle renforcé des missions locales dans l'accompagnement.",
    },
    {
      title: "Mobilité Européenne : Opportunités Erasmus+ 2024",
      description:
        "Tour d'horizon des appels à projets Erasmus+ ouverts pour les structures Info Jeunes en 2024.",
      type: "veille",
      status: "published",
      pinned: false,
      authorId: marcId,
      tags: ["mobilite-europeenne", "formation"],
      body: "Erasmus+ 2024 ouvre de nouvelles opportunités pour les structures IJ : projets KA1 (mobilité individuelle), KA2 (partenariats stratégiques) et KA3 (réforme des politiques). Les dossiers sont à déposer avant le 5 mars 2024.",
    },
    {
      title: "Prise en main de Hub Pro",
      description:
        "Tutoriel d'introduction complet pour les nouveaux utilisateurs de la plateforme.",
      type: "tutorial",
      status: "published",
      pinned: false,
      authorId: adminId,
      tags: ["numerique"],
      body: "Bienvenue sur Hub Pro ! Ce guide d'introduction vous présente les principales fonctionnalités de la plateforme : navigation dans le tableau de bord, lecture de l'actualité réseau, consultation de l'annuaire, accès à la boîte à outils et utilisation de la messagerie.",
    },
    {
      title: "Créer et Publier un Post dans l'Actualité",
      description:
        "Comment rédiger, illustrer et publier une actualité visible par tout le réseau IJ PDL.",
      type: "tutorial",
      status: "published",
      pinned: false,
      authorId: marieId,
      tags: ["numerique"],
      body: "Ce tutoriel explique étape par étape comment créer une publication dans le fil d'actualité : accéder au compositeur, rédiger votre message, ajouter un document ou une image, sélectionner les tags pertinents et publier. Les membres Pro Réseau verront leur publication soumise à validation.",
    },
  ];

  const resourceIds: string[] = [];
  for (const r of resourceDefs) {
    const id = createId();
    resourceIds.push(id);
    await db.insert(schema.resources).values({
      id,
      title: r.title,
      description: r.description,
      body: r.body ?? null,
      type: r.type,
      status: r.status,
      pinned: r.pinned,
      authorId: r.authorId,
      approvedById: adminId,
    });
    for (const slug of r.tags) {
      await db.insert(schema.resourceTags).values({
        resourceId: id,
        tagId: tagIds[slug],
      });
    }
  }
  console.log(`✓ ${resourceDefs.length} resources`);

  // ── Posts ──────────────────────────────────────────────────────────────────

  const postDefs = [
    {
      authorId: marieId,
      body: "Le kit de communication national « Job d'Été 2024 » est désormais disponible dans votre Boîte à Outils ! Préparez vos événements locaux avec les affiches et visuels réseaux sociaux. N'hésitez pas à adapter selon votre territoire.",
      pinned: true,
      createdAt: hoursAgo(2),
    },
    {
      authorId: adminId,
      body: "⚠️ Maintenance programmée des serveurs Hub Pro ce vendredi à 18h. Une coupure de 30 minutes est prévue pour améliorer les performances de la plateforme. Pensez à sauvegarder vos travaux en cours.",
      pinned: false,
      createdAt: hoursAgo(5),
    },
    {
      authorId: sarahId,
      body: "Nouvelle formation disponible : « Accueil inclusif du public spécifique ». Inscrivez-vous dès maintenant pour la session du mois prochain. Places limitées à 15 participants. Programme complet en commentaire.",
      pinned: false,
      createdAt: daysAgo(1),
    },
    {
      authorId: sophieId,
      body: "Retour en images sur le séminaire inter-régional qui s'est tenu hier à Nantes. Un moment d'échange riche sur l'avenir de l'orientation professionnelle pour les 15-25 ans. Merci à tous les participants ! La restitution complète sera publiée la semaine prochaine.",
      pinned: false,
      createdAt: daysAgo(2),
    },
    {
      authorId: thomasId,
      body: "Rappel : la clôture des appels à projets « Été Jeunes » approche. Date limite : dans 2 jours. Si vous avez des questions sur le montage de dossier, je suis disponible pour vous accompagner. Contactez-moi via la messagerie.",
      pinned: false,
      createdAt: daysAgo(3),
    },
  ];

  const postIds: string[] = [];
  for (const p of postDefs) {
    const id = createId();
    postIds.push(id);
    await db.insert(schema.posts).values({
      id,
      authorId: p.authorId,
      body: p.body,
      pinned: p.pinned,
      createdAt: p.createdAt,
      updatedAt: p.createdAt,
    });
  }

  // A few reactions on the first two posts
  await db.insert(schema.postReactions).values([
    { postId: postIds[0], userId: thomasId, emoji: "👍" },
    { postId: postIds[0], userId: sophieId, emoji: "👍" },
    { postId: postIds[0], userId: sarahId, emoji: "👍" },
    { postId: postIds[1], userId: marieId, emoji: "👍" },
    { postId: postIds[1], userId: marcId, emoji: "👍" },
  ]);

  console.log(`✓ ${postDefs.length} posts`);

  // ── Events ─────────────────────────────────────────────────────────────────

  const eventDefs: {
    title: string;
    description: string;
    location?: string;
    startAt: Date;
    endAt: Date;
    category: "reunion" | "formation" | "evenement" | "autre";
    isInternal: boolean;
    createdById: string;
  }[] = [
    {
      title: "Réunion de Coordination Réseau",
      description:
        "Point mensuel des coordinateurs IJ Pays de la Loire. Ordre du jour : bilan campagne Job d'Été, préparation séminaire automne, questions diverses.",
      location: "Visioconférence (lien envoyé par email)",
      startAt: new Date(daysFromNow(10).setHours(9, 30, 0, 0)),
      endAt: new Date(daysFromNow(10).setHours(11, 0, 0, 0)),
      category: "reunion",
      isInternal: true,
      createdById: adminId,
    },
    {
      title: "Atelier Mobilité Européenne",
      description:
        "Journée de formation sur les dispositifs Erasmus+ pour les structures IJ. Présentation des appels à projets ouverts en 2024 et accompagnement au montage de dossier.",
      location: "Salle Polyvalente, Cité des Congrès, Nantes",
      startAt: new Date(daysFromNow(13).setHours(14, 0, 0, 0)),
      endAt: new Date(daysFromNow(13).setHours(17, 30, 0, 0)),
      category: "formation",
      isInternal: false,
      createdById: marcId,
    },
    {
      title: "Déjeuner d'Équipe IJ Nantes",
      description:
        "Repas convivial de l'équipe IJ Nantes Métropole. Bienvenue à nos nouvelles recrues !",
      location: "Le Bistrot des Jeunes, 12 rue de la Paix, Nantes",
      startAt: new Date(daysFromNow(17).setHours(12, 30, 0, 0)),
      endAt: new Date(daysFromNow(17).setHours(14, 0, 0, 0)),
      category: "autre",
      isInternal: true,
      createdById: marieId,
    },
    {
      title: "Webinaire : Réforme de l'Apprentissage",
      description:
        "Webinaire national sur les impacts de la réforme de l'apprentissage pour les professionnels IJ. Intervenants : DARES, CIDJ, représentants régionaux.",
      location: "En ligne — lien Zoom communiqué la veille",
      startAt: new Date(daysFromNow(1).setHours(10, 0, 0, 0)),
      endAt: new Date(daysFromNow(1).setHours(12, 0, 0, 0)),
      category: "formation",
      isInternal: false,
      createdById: sarahId,
    },
    {
      title: "Journée Régionale IJ Pays de la Loire",
      description:
        "Grande journée annuelle du réseau IJ PDL. Ateliers thématiques, présentation des projets phares, remise des prix réseau. Inscription obligatoire.",
      location: "Le Quai, 17 Rue de la Tannerie, Angers",
      startAt: new Date(daysFromNow(45).setHours(9, 0, 0, 0)),
      endAt: new Date(daysFromNow(45).setHours(18, 0, 0, 0)),
      category: "evenement",
      isInternal: false,
      createdById: adminId,
    },
  ];

  for (const e of eventDefs) {
    await db.insert(schema.events).values({
      id: createId(),
      ...e,
    });
  }
  console.log(`✓ ${eventDefs.length} events`);

  // ── Channels + Messages ─────────────────────────────────────────────────────

  const generalId = createId();
  const formationsId = createId();

  await db.insert(schema.channels).values([
    {
      id: generalId,
      name: "général",
      description: "Canal principal du réseau IJ PDL",
      type: "channel",
      createdById: adminId,
    },
    {
      id: formationsId,
      name: "formations",
      description: "Échanges sur les formations et dispositifs",
      type: "channel",
      createdById: adminId,
    },
  ]);

  // Members
  const allUserIds = Object.values(userIds);
  for (const uid of allUserIds) {
    await db
      .insert(schema.channelMembers)
      .values({ channelId: generalId, userId: uid });
  }
  for (const uid of [adminId, marieId, thomasId, sarahId, marcId]) {
    await db
      .insert(schema.channelMembers)
      .values({ channelId: formationsId, userId: uid });
  }

  // Messages — #général
  const generalMessages = [
    {
      authorId: marieId,
      body: "Bonjour à tous ! 👋 Bienvenue sur Hub Pro. N'hésitez pas à explorer les différentes sections.",
      createdAt: daysAgo(5),
    },
    {
      authorId: thomasId,
      body: "Merci pour l'accès ! Je viens de trouver le guide des dispositifs régionaux dans la boîte à outils, très utile.",
      createdAt: daysAgo(4),
    },
    {
      authorId: sophieId,
      body: "Est-ce que tu as fini le dossier pour l'appel à projets « Été Jeunes » Thomas ?",
      createdAt: hoursAgo(3),
    },
    {
      authorId: thomasId,
      body: "Presque ! Je l'envoie ce soir. On se voit à la réunion de coordination la semaine prochaine ?",
      createdAt: hoursAgo(2),
    },
  ];

  // Messages — #formations
  const formationsMessages = [
    {
      authorId: sarahId,
      body: "Je mets en ligne le programme détaillé du webinaire sur la réforme de l'apprentissage. Pensez à vous inscrire !",
      createdAt: daysAgo(2),
    },
    {
      authorId: marcId,
      body: "Merci Sarah. Est-ce qu'il y aura un replay disponible pour ceux qui ne peuvent pas y assister en direct ?",
      createdAt: daysAgo(1),
    },
    {
      authorId: sarahId,
      body: "Oui, le replay sera disponible dans la boîte à outils 48h après la session.",
      createdAt: hoursAgo(6),
    },
  ];

  for (const m of generalMessages) {
    await db.insert(schema.chatMessages).values({
      id: createId(),
      channelId: generalId,
      authorId: m.authorId,
      body: m.body,
      createdAt: m.createdAt,
    });
  }
  for (const m of formationsMessages) {
    await db.insert(schema.chatMessages).values({
      id: createId(),
      channelId: formationsId,
      authorId: m.authorId,
      body: m.body,
      createdAt: m.createdAt,
    });
  }

  console.log(
    `✓ 2 channels, ${generalMessages.length + formationsMessages.length} messages`,
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...\n");
  await clearAll();
  await seed();
  console.log("\n✅ Done! Login with alexandre.martin@ij-pdl.fr / password123");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
