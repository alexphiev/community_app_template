import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"

const SUPPORTED_LOCALES = ["fr", "en"] as const
type Locale = (typeof SUPPORTED_LOCALES)[number]

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const raw = cookieStore.get("locale")?.value
  const locale: Locale = (SUPPORTED_LOCALES as readonly string[]).includes(raw ?? "") ? (raw as Locale) : "fr"
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
