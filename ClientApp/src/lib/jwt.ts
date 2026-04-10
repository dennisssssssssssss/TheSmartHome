export interface JwtPayload {
  sub?: string
  exp?: number
  [key: string]: unknown
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  return atob(padded)
}

export function decodeJwtPayload(token: string): JwtPayload {
  const [, payload] = token.split('.')

  if (!payload) {
    throw new Error('Invalid token payload')
  }

  return JSON.parse(decodeBase64Url(payload)) as JwtPayload
}
