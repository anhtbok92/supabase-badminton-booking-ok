'use client';

import { useContext } from 'react';
import { TenantCtx } from '@/components/tenant-provider';
import type { TenantContext } from '@/lib/tenant';

/**
 * Client hook to access the current tenant context.
 * Returns null when the app is running on the main domain (no tenant).
 */
export function useTenant(): TenantContext | null {
  return useContext(TenantCtx);
}
