import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInviteEmail({
  to,
  name,
  inviteUrl,
}: {
  to: string
  name?: string | null
  inviteUrl: string
}) {
  const greeting = name ? `Bonjour ${name},` : "Bonjour,"

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: "Vous êtes invité à rejoindre Hub Pro — Réseau Info Jeunes PDL",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#ffffff">
        <h1 style="font-size:24px;font-weight:700;color:#0f766e;margin-bottom:8px">Hub Pro</h1>
        <p style="font-size:12px;color:#3e4948;margin-top:0">Réseau Info Jeunes Pays de la Loire</p>
        <hr style="border:none;border-top:1px solid #bdc9c7;margin:24px 0"/>
        <p style="font-size:16px;color:#181d1c">${greeting}</p>
        <p style="font-size:16px;color:#181d1c">
          Vous avez été invité à rejoindre <strong>Hub Pro</strong>, la plateforme professionnelle du Réseau Info Jeunes Pays de la Loire.
        </p>
        <p style="font-size:14px;color:#3e4948">
          Cliquez sur le bouton ci-dessous pour créer votre compte. Ce lien est valable <strong>72 heures</strong>.
        </p>
        <div style="text-align:center;margin:32px 0">
          <a href="${inviteUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600">
            Créer mon compte
          </a>
        </div>
        <p style="font-size:12px;color:#6e7978">
          Si vous n'attendiez pas cette invitation, ignorez cet email.
        </p>
      </div>
    `,
  })
}
