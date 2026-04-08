const DOMAIN = 'sportbooking.online'
const LEGACY_DOMAIN = 'badminton.vn'

export function phoneToEmail(phone: string): string {
  return `${phone}@${DOMAIN}`
}

export function phonToLegacyEmail(phone: string): string {
  return `${phone}@${LEGACY_DOMAIN}`
}

export function emailToPhone(email: string): string {
  return email.replace(`@${DOMAIN}`, '').replace(`@${LEGACY_DOMAIN}`, '')
}
