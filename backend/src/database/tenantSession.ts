/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataSource, EntityManager, ObjectLiteral, QueryRunner, Repository } from 'typeorm';
import {
  getTenantStore,
  isTenantScopeBypassed,
} from '../middleware/tenantContext';

/**
 * Postgres tenant session variables (Mission 2, Phase A2b).
 *
 * The second isolation layer: every tenant-scoped statement runs inside a
 * transaction whose connection carries
 *     app.current_tenant_id  (scoped requests)   or
 *     app.tenant_bypass      (withoutTenantScope flows)
 * set via `set_config(..., is_local => true)` — the parameterised equivalent
 * of SET LOCAL, so the value dies with the transaction and can never leak
 * across pooled connections (Phase B verifies this with an explicit test).
 *
 * Phase B RLS policies key off these vars:
 *     USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid
 *            OR current_setting('app.tenant_bypass', true) = 'on')
 *
 * Routing rules (driven from the tenantScope patches):
 *  - call already inside a transaction (manager.queryRunner active): stamp the
 *    runner once per (runner, value) and execute as-is.
 *  - standalone call with tenant context or bypass: wrap in a short
 *    transaction on a dedicated runner, stamp, execute, commit.
 *  - no context at all: execute unrouted (app-side rules already constrain
 *    these to explicitly tenant-qualified criteria).
 */

export type SessionStamp =
  | { kind: 'tenant'; tenantId: string }
  | { kind: 'bypass' };

/** Stamp for the current AsyncLocalStorage context, if any. */
export const currentSessionStamp = (): SessionStamp | undefined => {
  if (isTenantScopeBypassed()) return { kind: 'bypass' };
  const tenantId = getTenantStore()?.tenantId;
  if (tenantId) return { kind: 'tenant', tenantId };
  return undefined;
};

const stamped = new WeakMap<QueryRunner, string>();

const stampKey = (stamp: SessionStamp): string =>
  stamp.kind === 'tenant' ? `t:${stamp.tenantId}` : 'bypass';

/** Issue set_config on the runner's connection (idempotent per txn+value). */
export const stampRunner = async (
  runner: QueryRunner,
  stamp: SessionStamp
): Promise<void> => {
  const key = stampKey(stamp);
  if (stamped.get(runner) === key) return;
  if (stamp.kind === 'tenant') {
    await runner.query(
      `SELECT set_config('app.current_tenant_id', $1, true), set_config('app.tenant_bypass', '', true)`,
      [stamp.tenantId]
    );
  } else {
    await runner.query(
      `SELECT set_config('app.tenant_bypass', 'on', true), set_config('app.current_tenant_id', '', true)`
    );
  }
  stamped.set(runner, key);
};

/** The active transactional runner behind a manager, if any. */
export const activeRunner = (manager: EntityManager): QueryRunner | undefined => {
  const runner = manager.queryRunner;
  return runner && runner.isTransactionActive ? runner : undefined;
};

/**
 * Execute `fn` on a manager whose connection carries the stamp:
 *  - reuses the caller's active transaction when there is one,
 *  - otherwise opens a short dedicated transaction.
 */
export const withStampedManager = async <T>(
  connection: DataSource,
  manager: EntityManager,
  stamp: SessionStamp | undefined,
  fn: (manager: EntityManager) => Promise<T>
): Promise<T> => {
  if (!stamp) {
    return fn(manager); // no context — nothing to stamp
  }
  const existing = activeRunner(manager);
  if (existing) {
    await stampRunner(existing, stamp);
    return fn(manager);
  }
  const runner = connection.createQueryRunner();
  try {
    await runner.connect();
    await runner.startTransaction();
    await stampRunner(runner, stamp);
    const result = await fn(runner.manager);
    await runner.commitTransaction();
    return result;
  } catch (error) {
    if (runner.isTransactionActive) {
      try {
        await runner.rollbackTransaction();
      } catch {
        /* original error wins */
      }
    }
    throw error;
  } finally {
    await runner.release();
  }
};

/** Repository variant: re-binds the call onto a stamped manager's repository. */
export const withStampedRepository = async <T>(
  repo: Repository<ObjectLiteral>,
  stamp: SessionStamp | undefined,
  fn: (repo: Repository<ObjectLiteral>) => Promise<T>
): Promise<T> => {
  const connection = repo.manager.connection;
  return withStampedManager(connection, repo.manager, stamp, (manager) =>
    fn(manager === repo.manager ? repo : manager.getRepository(repo.target))
  );
};
