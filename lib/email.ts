import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL!

const baseStyle = `font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#ffffff`
const brandHeader = `
  <h1 style="font-size:24px;font-weight:700;color:#0f766e;margin-bottom:8px">Hub Pro</h1>
  <p style="font-size:12px;color:#3e4948;margin-top:0">Réseau Info Jeunes Pays de la Loire</p>
  <hr style="border:none;border-top:1px solid #bdc9c7;margin:24px 0"/>
`
const btn = (url: string, label: string) => `
  <div style="text-align:center;margin:32px 0">
    <a href="${url}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600">${label}</a>
  </div>
`
const ignore = `<p style="font-size:12px;color:#6e7978">Si vous n'attendiez pas cet email, ignorez-le.</p>`

export async function sendInviteEmail({ to, name, inviteUrl }: { to: string; name?: string | null; inviteUrl: string }) {
  const greeting = name ? `Bonjour ${name},` : "Bonjour,"
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Vous êtes invité à rejoindre Hub Pro — Réseau Info Jeunes PDL",
    html: `<div style="${baseStyle}">${brandHeader}
      <p style="font-size:16px;color:#181d1c">${greeting}</p>
      <p style="font-size:16px;color:#181d1c">Vous avez été invité à rejoindre <strong>Hub Pro</strong>.</p>
      <p style="font-size:14px;color:#3e4948">Ce lien est valable <strong>72 heures</strong>.</p>
      ${btn(inviteUrl, "Créer mon compte")}
      ${ignore}
    </div>`,
  })
}

export async function sendVerificationEmail({ to, name, verifyUrl }: { to: string; name?: string | null; verifyUrl: string }) {
  const greeting = name ? `Bonjour ${name},` : "Bonjour,"
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Confirmez votre email — Hub Pro",
    html: `<div style="${baseStyle}">${brandHeader}
      <p style="font-size:16px;color:#181d1c">${greeting}</p>
      <p style="font-size:16px;color:#181d1c">Merci de créer votre compte sur <strong>Hub Pro</strong>. Confirmez votre adresse email pour activer votre compte.</p>
      <p style="font-size:14px;color:#3e4948">Ce lien est valable <strong>24 heures</strong>.</p>
      ${btn(verifyUrl, "Confirmer mon email")}
      ${ignore}
    </div>`,
  })
}

export async function sendPasswordResetEmail({ to, name, resetUrl }: { to: string; name?: string | null; resetUrl: string }) {
  const greeting = name ? `Bonjour ${name},` : "Bonjour,"
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Réinitialisation de mot de passe — Hub Pro",
    html: `<div style="${baseStyle}">${brandHeader}
      <p style="font-size:16px;color:#181d1c">${greeting}</p>
      <p style="font-size:16px;color:#181d1c">Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p style="font-size:14px;color:#3e4948">Ce lien est valable <strong>1 heure</strong>.</p>
      ${btn(resetUrl, "Réinitialiser mon mot de passe")}
      ${ignore}
    </div>`,
  })
}
