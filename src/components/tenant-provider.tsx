'use client';

import { createContext, type ReactNode } from 'react';
import type { TenantContext } from '@/lib/tenant';

export const TenantCtx = createContext<TenantContext | null>(null);

export function TenantProvider({
  children,
  tenant,
}: {
  children: ReactNode;
  tenant: TenantContext | null;
}) {
  return <TenantCtx.Provider value={tenant}>{children}</TenantCtx.Provider>;
}
