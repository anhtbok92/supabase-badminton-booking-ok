import { headers } from 'next/headers';

export interface TenantContext {
  clubId: string;
  clubName: string;
  subdomain: string;
}

const TENANT_HEADER = 'x-tenant-context';

const RESERVED_SUBDOMAINS = [
  'app', 'www', 'api', 'admin', 'mail', 'ftp',
  'staging', 'dev', 'test', 'beta', 'demo',
  'static', 'cdn', 'assets', 'img', 'images',
  'ns1', 'ns2', 'dns', 'mx',
] as const;

const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const MAX_SUBDOMAIN_LENGTH = 63;

/**
 * Serialize a TenantContext to a JSON string for use in request headers.
 */
export function serializeTenantContext(ctx: TenantContext): string {
  return JSON.stringify(ctx);
}

/**
 * Deserialize a TenantContext from a JSON header value.
 * Returns null if the value is invalid or cannot be parsed.
 */
export function deserializeTenantContext(headerValue: string): TenantContext | null {
  try {
    const parsed = JSON.parse(headerValue);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.clubId === 'string' &&
      typeof parsed.clubName === 'string' &&
      typeof parsed.subdomain === 'string' &&
      parsed.clubId.length > 0 &&
      parsed.clubName.length > 0 &&
      parsed.subdomain.length > 0
    ) {
      return {
        clubId: parsed.clubId,
        clubName: parsed.clubName,
        subdomain: parsed.subdomain,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Read the TenantContext from request headers (server-side only).
 * Returns null if no tenant context is present or if it's invalid.
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const headerStore = await headers();
  const value = headerStore.get(TENANT_HEADER);
  if (!value) return null;
  return deserializeTenantContext(value);
}

/**
 * Check if a subdomain is in the reserved list.
 */
export function isReservedSubdomain(subdomain: string): boolean {
  return (RESERVED_SUBDOMAINS as readonly string[]).includes(subdomain.toLowerCase());
}

/**
 * Validate that a subdomain string matches the allowed format:
 * - Only lowercase alphanumeric and hyphens
 * - Cannot start or end with a hyphen
 * - Max 63 characters
 */
export function isValidSubdomain(value: string): boolean {
  if (value.length === 0 || value.length > MAX_SUBDOMAIN_LENGTH) return false;
  return SUBDOMAIN_REGEX.test(value);
}

/**
 * Extract the subdomain from a hostname given a base domain.
 * Returns null if the hostname is the base domain itself or doesn't end with it.
 *
 * Examples:
 *   extractSubdomain('club.sportbooking.online', 'sportbooking.online') → 'club'
 *   extractSubdomain('sportbooking.online', 'sportbooking.online') → null
 *   extractSubdomain('other.com', 'sportbooking.online') → null
 *   extractSubdomain('club.localhost:3000', 'localhost:3000') → 'club'
 */
export function extractSubdomain(hostname: string, baseDomain: string): string | null {
  const host = hostname.toLowerCase();
  const base = baseDomain.toLowerCase();

  if (host === base) return null;

  const suffix = '.' + base;
  if (!host.endsWith(suffix)) return null;

  const subdomain = host.slice(0, host.length - suffix.length);

  // Subdomain should not contain dots (no nested subdomains)
  if (subdomain.includes('.')) return null;

  if (subdomain.length === 0) return null;

  return subdomain;
}
