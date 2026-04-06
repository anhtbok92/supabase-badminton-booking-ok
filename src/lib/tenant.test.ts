import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  extractSubdomain,
  isReservedSubdomain,
  isValidSubdomain,
  serializeTenantContext,
  deserializeTenantContext,
  TenantContext,
} from './tenant';

// ============================================================
// Generators
// ============================================================

const alphanumChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
const alphanumHyphenChars = alphanumChars + '-';

/** Generate a valid subdomain label: lowercase alphanumeric + hyphens, no leading/trailing hyphen, 1-63 chars */
const validSubdomainArb = fc
  .tuple(
    fc.constantFrom(...alphanumChars.split('')),
    fc.array(fc.constantFrom(...alphanumHyphenChars.split('')), { minLength: 0, maxLength: 30 }),
    fc.constantFrom(...alphanumChars.split(''), ''),
  )
  .map(([first, middle, last]) => {
    const s = first + middle.join('') + last;
    return s.length <= 63 ? s : s.slice(0, 63);
  })
  .filter((s) => s.length >= 1 && s.length <= 63);

/** Generate a valid TenantContext */
const tenantContextArb: fc.Arbitrary<TenantContext> = fc.record({
  clubId: fc.uuid(),
  clubName: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  subdomain: validSubdomainArb,
});

const RESERVED_LIST = [
  'app', 'www', 'api', 'admin', 'mail', 'ftp',
  'staging', 'dev', 'test', 'beta', 'demo',
  'static', 'cdn', 'assets', 'img', 'images',
  'ns1', 'ns2', 'dns', 'mx',
];

// ============================================================
// Feature: multi-tenant-subdomain, Property 1: Subdomain extraction correctness
// Validates: Requirements 1.1
// ============================================================
describe('Property 1: Subdomain extraction correctness', () => {
  const baseDomain = 'sportbooking.online';

  it('for any valid subdomain, extractSubdomain("{sub}.{base}", base) returns the subdomain', () => {
    fc.assert(
      fc.property(validSubdomainArb, (sub) => {
        const hostname = `${sub}.${baseDomain}`;
        expect(extractSubdomain(hostname, baseDomain)).toBe(sub);
      }),
      { numRuns: 100 },
    );
  });

  it('extractSubdomain(baseDomain, baseDomain) returns null', () => {
    expect(extractSubdomain(baseDomain, baseDomain)).toBeNull();
  });

  it('for any hostname not ending with .baseDomain, extractSubdomain returns null', () => {
    fc.assert(
      fc.property(
        fc.webUrl().map((url) => new URL(url).hostname).filter((h) => !h.endsWith(`.${baseDomain}`) && h !== baseDomain),
        (hostname) => {
          expect(extractSubdomain(hostname, baseDomain)).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ============================================================
// Feature: multi-tenant-subdomain, Property 2: Reserved subdomain exclusion
// Validates: Requirements 1.4
// ============================================================
describe('Property 2: Reserved subdomain exclusion', () => {
  it('for any subdomain in the reserved list, isReservedSubdomain returns true', () => {
    fc.assert(
      fc.property(fc.constantFrom(...RESERVED_LIST), (sub) => {
        expect(isReservedSubdomain(sub)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('for any subdomain NOT in the reserved list, isReservedSubdomain returns false', () => {
    fc.assert(
      fc.property(
        validSubdomainArb.filter((s) => !RESERVED_LIST.includes(s)),
        (sub) => {
          expect(isReservedSubdomain(sub)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ============================================================
// Feature: multi-tenant-subdomain, Property 3: Subdomain format validation
// Validates: Requirements 2.1, 5.2
// ============================================================
describe('Property 3: Subdomain format validation', () => {
  const regex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

  it('for any valid subdomain (matching regex, ≤63 chars), isValidSubdomain returns true', () => {
    fc.assert(
      fc.property(validSubdomainArb, (sub) => {
        expect(isValidSubdomain(sub)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('for strings with uppercase letters, isValidSubdomain returns false', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /[A-Z]/.test(s)),
        (s) => {
          expect(isValidSubdomain(s)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('for strings starting with a hyphen, isValidSubdomain returns false', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).map((s) => '-' + s),
        (s) => {
          expect(isValidSubdomain(s)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('for strings ending with a hyphen, isValidSubdomain returns false', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...alphanumChars.split('')), { minLength: 1, maxLength: 20 })
          .map((arr) => arr.join('') + '-'),
        (s) => {
          expect(isValidSubdomain(s)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('for strings longer than 63 characters, isValidSubdomain returns false', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...alphanumChars.split('')), { minLength: 64, maxLength: 100 })
          .map((arr) => arr.join('')),
        (s) => {
          expect(isValidSubdomain(s)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('empty string returns false', () => {
    expect(isValidSubdomain('')).toBe(false);
  });
});

// ============================================================
// Feature: multi-tenant-subdomain, Property 5: Tenant context serialization round-trip
// Validates: Requirements 7.3
// ============================================================
describe('Property 5: Tenant context serialization round-trip', () => {
  it('for any valid TenantContext, serialize then deserialize produces an equivalent object', () => {
    fc.assert(
      fc.property(tenantContextArb, (ctx) => {
        const serialized = serializeTenantContext(ctx);
        const deserialized = deserializeTenantContext(serialized);
        expect(deserialized).toEqual(ctx);
      }),
      { numRuns: 100 },
    );
  });

  it('deserializing invalid JSON returns null', () => {
    expect(deserializeTenantContext('not-json')).toBeNull();
    expect(deserializeTenantContext('')).toBeNull();
    expect(deserializeTenantContext('{}')).toBeNull();
  });
});
