import { getInviteByToken, acceptInvite } from "@/lib/actions/invites"
import { publicRegister } from "@/lib/actions/auth"

async function acceptInviteAction(formData: FormData): Promise<void> {
  "use server"
  await acceptInvite(formData)
}

async function publicRegisterAction(formData: FormData): Promise<void> {
  "use server"
  await publicRegister(formData)
}

type Props = { searchParams: Promise<{ token?: string; pending?: string }> }

export default async function RegisterPage({ searchParams }: Props) {
  const { token, pending } = await searchParams

  if (pending) return <PendingVerification />
  if (token) return <InviteForm token={token} />
  return <PublicRegisterForm />
}

async function InviteForm({ token }: { token: string }) {
  const invite = await getInviteByToken(token)
  const isValid = invite && !invite.usedAt && invite.expiresAt > new Date()
  if (!isValid) return <InvalidLink />

  return (
    <AuthCard subtitle="Créez votre compte">
      <form className="flex flex-col gap-5" action={acceptInviteAction}>
        <input type="hidden" name="token" value={token} />
        <Field id="name" label="Nom complet" name="name" defaultValue={invite.name ?? ""} placeholder="Prénom Nom" autoComplete="name" />
        <PasswordField id="password" label="Mot de passe" name="password" placeholder="8 caractères minimum" />
        <PasswordField id="confirmPassword" label="Confirmer le mot de passe" name="confirmPassword" placeholder="••••••••" />
        <SubmitButton>Créer mon compte</SubmitButton>
      </form>
      <BackLink />
    </AuthCard>
  )
}

function PublicRegisterForm() {
  return (
    <AuthCard subtitle="Créez votre compte">
      <form className="flex flex-col gap-5" action={publicRegisterAction}>
        <Field id="name" label="Nom complet" name="name" placeholder="Prénom Nom" autoComplete="name" />
        <Field id="email" label="Email professionnel" name="email" type="email" placeholder="prenom.nom@structure.fr" autoComplete="email" />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="text-[14px] font-medium text-[#181d1c]">Rôle dans le réseau</label>
          <select
            id="role"
            name="role"
            className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
          >
            <option value="pro_reseau_ij">Pro Réseau IJ</option>
            <option value="salarie_ij_pdl">Salarié IJ PDL</option>
            <option value="relais_externe">Relais externe</option>
            <option value="guest">Invité</option>
          </select>
        </div>
        <PasswordField id="password" label="Mot de passe" name="password" placeholder="8 caractères minimum" />
        <PasswordField id="confirmPassword" label="Confirmer le mot de passe" name="confirmPassword" placeholder="••••••••" />
        <SubmitButton>Créer mon compte</SubmitButton>
      </form>
      <BackLink />
    </AuthCard>
  )
}

function PendingVerification() {
  return (
    <AuthCard subtitle="Vérifiez votre email">
      <div className="text-center py-4">
        <span className="material-symbols-outlined text-[48px] text-teal-700 mb-4 block">mark_email_unread</span>
        <p className="text-[14px] text-[#3e4948] mb-6">
          Un email de confirmation vous a été envoyé. Cliquez sur le lien dans l&apos;email pour activer votre compte.
        </p>
        <p className="text-[13px] text-[#6e7978]">Le lien est valable 24 heures.</p>
      </div>
      <BackLink />
    </AuthCard>
  )
}

function AuthCard({ subtitle, children }: { subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
      <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8">
        <div className="mb-8">
          <h1 className="text-[31px] font-semibold leading-[1.25] text-teal-700 mb-1" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
            Hub Pro
          </h1>
          <p className="text-[14px] text-[#3e4948]">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ id, label, name, type = "text", placeholder, defaultValue, autoComplete }: {
  id: string; label: string; name: string; type?: string; placeholder?: string; defaultValue?: string; autoComplete?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[14px] font-medium text-[#181d1c]">{label}</label>
      <input id={id} name={name} type={type} required autoComplete={autoComplete} defaultValue={defaultValue}
        className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
        placeholder={placeholder} />
    </div>
  )
}

function PasswordField({ id, label, name, placeholder }: { id: string; label: string; name: string; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[14px] font-medium text-[#181d1c]">{label}</label>
      <input id={id} name={name} type="password" required minLength={8} autoComplete="new-password"
        className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
        placeholder={placeholder} />
    </div>
  )
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="submit"
      className="h-10 rounded-[6px] bg-teal-700 text-white text-[14px] font-medium hover:bg-teal-800 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2">
      {children}
    </button>
  )
}

function BackLink() {
  return (
    <p className="mt-6 text-center text-[13px] text-[#6e7978]">
      <a href="/login" className="text-teal-700 hover:underline">Retour à la connexion</a>
    </p>
  )
}

function InvalidLink() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
      <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8 text-center">
        <span className="material-symbols-outlined text-[48px] text-red-600 mb-4 block">link_off</span>
        <h1 className="text-[20px] font-semibold text-[#181d1c] mb-2" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
          Lien invalide ou expiré
        </h1>
        <p className="text-[14px] text-[#3e4948] mb-6">
          Ce lien d&apos;invitation est invalide ou a expiré (72h). Contactez votre administrateur pour recevoir une nouvelle invitation.
        </p>
        <a href="/login" className="text-teal-700 text-[14px] hover:underline">Retour à la connexion</a>
      </div>
    </div>
  )
}
