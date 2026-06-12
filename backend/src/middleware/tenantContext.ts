import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Shared tenant context (Mission 2, Phase A0)
 *
 * One AsyncLocalStorage store feeds BOTH isolation layers:
 *  - the app-side global tenant scope (scoped repositories) — works with RLS disabled
 *  - the Postgres session-var layer (`SET LOCAL app.current_tenant_id`) backing RLS
 *
 * Entry points that must establish a context:
 *  - HTTP:    `tenantContextMiddleware` (mounted once on the apiRouter, before all
 *             routes). It enters an EMPTY store; `authenticate` populates it by
 *             reference once the JWT is verified. Public routes simply leave it empty.
 *  - Socket:  `runWithTenant(...)` around each event handler (socketService).
 *  - Jobs:    `runWithTenant(...)` per tenant, or `withoutTenantScope(...)` for
 *             legitimately cross-tenant work (e.g. task-escalation cron).
 */

export type TenantContextSource = 'http' | 'socket' | 'job' | 'script' | 'test';

export interface TenantStore {
  tenantId?: string;
  userId?: string;
  role?: string;
  /** True only inside withoutTenantScope() — both scope layers honour it. */
  bypassTenantScope?: boolean;
  /** Reason string supplied to withoutTenantScope(); logged on entry. */
  bypassReason?: string;
  source: TenantContextSource;
}

export const tenantStorage = new AsyncLocalStorage<TenantStore>();

/**
 * Express middleware — enters an empty tenant context for the whole request.
 * Mount ONCE at the top of the apiRouter so every route (public or authed)
 * runs inside a store. `authenticate` fills it in after JWT verification.
 */
export const tenantContextMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  tenantStorage.run({ source: 'http' }, () => next());
};

/**
 * Populate the current store (called by the authenticate middleware after the
 * JWT + active-user/active-tenant DB checks pass). No-op outside a context.
 */
export const setTenantContext = (values: {
  tenantId: string;
  userId?: string;
  role?: string;
}): void => {
  const store = tenantStorage.getStore();
  if (store) {
    store.tenantId = values.tenantId;
    store.userId = values.userId;
    store.role = values.role;
  }
};

/** The current tenant id, or undefined when unauthenticated / outside a context. */
export const getTenantId = (): string | undefined =>
  tenantStorage.getStore()?.tenantId;

/** The full current store (read-only use), or undefined. */
export const getTenantStore = (): TenantStore | undefined =>
  tenantStorage.getStore();

/** True only inside withoutTenantScope(). */
export const isTenantScopeBypassed = (): boolean =>
  tenantStorage.getStore()?.bypassTenantScope === true;

/**
 * The current tenant id — throws if absent. Use in code paths that must never
 * run without tenant context (the scoped repository uses this).
 */
export const requireTenantId = (): string => {
  const store = tenantStorage.getStore();
  if (store?.bypassTenantScope) {
    throw new Error(
      'requireTenantId() called inside withoutTenantScope() — unscoped code must not ask for a tenant id'
    );
  }
  const tenantId = store?.tenantId;
  if (!tenantId) {
    throw new Error(
      'Tenant context missing. Authenticated requests must pass through tenantContextMiddleware + authenticate; ' +
        'jobs/sockets must use runWithTenant() or withoutTenantScope().'
    );
  }
  return tenantId;
};

/**
 * Run `fn` inside a tenant context — for Socket.IO handlers, per-tenant job
 * iterations, scripts and tests (anything outside the Express chain).
 */
export const runWithTenant = <T>(
  tenantId: string,
  fn: () => T,
  options?: { userId?: string; role?: string; source?: TenantContextSource }
): T =>
  tenantStorage.run(
    {
      tenantId,
      userId: options?.userId,
      role: options?.role,
      source: options?.source ?? 'job',
    },
    fn
  );

/**
 * EXPLICIT, LOGGED escape hatch (Phase A2c). The only sanctioned way to run
 * unscoped queries. Every use emits a structured warn line so bypasses are
 * auditable. Scoped repositories skip tenant injection only under this flag,
 * and the Phase B RLS layer keys its bypass off the same context.
 */
export const withoutTenantScope = <T>(
  reason: string,
  fn: () => T,
  options?: { source?: TenantContextSource }
): T => {
  const parent = tenantStorage.getStore();
  logger.warn('TENANT_SCOPE_BYPASS', {
    reason,
    source: options?.source ?? parent?.source ?? 'job',
    userId: parent?.userId,
    callerTenantId: parent?.tenantId,
  });
  return tenantStorage.run(
    {
      bypassTenantScope: true,
      bypassReason: reason,
      userId: parent?.userId,
      role: parent?.role,
      source: options?.source ?? parent?.source ?? 'job',
    },
    fn
  );
};

/** Alias used for super-admin flows — same mechanics, clearer intent at call sites. */
export const runAsSuperAdmin = withoutTenantScope;
