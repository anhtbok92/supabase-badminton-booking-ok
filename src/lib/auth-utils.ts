const DOMAIN = 'badminton.vn'

export function phoneToEmail(phone: string): string {
  return `${phone}@${DOMAIN}`
}

export function emailToPhone(email: string): string {
  return email.replace(`@${DOMAIN}`, '')
}
