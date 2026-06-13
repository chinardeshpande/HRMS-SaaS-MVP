/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  In,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import {
  getTenantStore,
  isTenantScopeBypassed,
} from '../middleware/tenantContext';
import { logger } from '../utils/logger';
import {
  SessionStamp,
  stampRunner,
  withStampedRepository,
} from './tenantSession';

/**
 * App-side global tenant scope (Mission 2, Phase A2a).
 *
 * Patches Repository.prototype so that EVERY repository query — including
 * repositories obtained inside transactions via `manager.getRepository()` —
 * is tenant-filtered by default. This layer is deliberately independent of
 * Postgres RLS (Phase B): either layer alone must stop cross-tenant access.
 *
 * Behaviour matrix (per call, for entities with a tenantId column):
 *   - withoutTenantScope() active  -> raw TypeORM behaviour (logged at entry).
 *   - tenant context present       -> tenantId injected into criteria/entities;
 *                                     an EXPLICIT mismatching tenantId throws
 *                                     (kills write-injection attacks).
 *   - no tenant context            -> allowed only when the criteria/entity
 *                                     already carries an explicit tenantId
 *                                     (e.g. the authenticate middleware's
 *                                     JWT-scoped lookups); otherwise throws.
 *
 * Special cases:
 *   - Tenant entity: its PK *is* tenantId, so reads/updates/deletes are scoped
 *     to the caller's own tenant; creation (save/insert/upsert) is exempt so
 *     registration can mint new tenants.
 *   - Entities without a tenantId column (Permission): exempt.
 *   - repository.query(): raw SQL cannot be scoped — blocked outside
 *     withoutTenantScope().
 *
 * NOT covered here (by design — RLS in Phase B is the backstop, and the CI
 * guard bans new occurrences): dataSource.query(), manager.query(),
 * dataSource/manager.createQueryBuilder() used directly.
 */

export class TenantScopeError extends Error {
  public readonly code = 'TENANT_SCOPE_VIOLATION';
  constructor(message: string) {
    super(`[tenant-scope] ${message}`);
    this.name = 'TenantScopeError';
  }
}

const TENANT_COLUMN = 'tenantId';
const QB_GUARDED = Symbol('tenantScopeGuarded');

type ScopeMode =
  | { kind: 'bypass' }
  | { kind: 'scoped'; tenantId: string }
  | { kind: 'unscoped' }; // no context — explicit criteria required

const currentMode = (): ScopeMode => {
  if (isTenantScopeBypassed()) return { kind: 'bypass' };
  const tenantId = getTenantStore()?.tenantId;
  if (tenantId) return { kind: 'scoped', tenantId };
  return { kind: 'unscoped' };
};

/** Session stamp for the RLS layer (A2b) — undefined when there is nothing to stamp. */
const stampFor = (mode: ScopeMode): SessionStamp | undefined => {
  if (mode.kind === 'scoped') return { kind: 'tenant', tenantId: mode.tenantId };
  if (mode.kind === 'bypass') return { kind: 'bypass' };
  return undefined;
};

/** Does this repository's entity participate in tenant scoping? */
const isTenantScopedRepo = (repo: Repository<ObjectLiteral>): boolean => {
  try {
    return !!repo.metadata.findColumnWithPropertyName(TENANT_COLUMN);
  } catch {
    // Metadata not available (uninitialised datasource edge) — fail closed
    // for safety by treating it as scoped; queries will throw without context.
    return true;
  }
};

const isTenantEntity = (repo: Repository<ObjectLiteral>): boolean => {
  try {
    return repo.metadata.tableName === 'tenants';
  } catch {
    return false;
  }
};

const describe = (repo: Repository<ObjectLiteral>, method: string): string => {
  let entity = 'unknown';
  try {
    entity = repo.metadata.name;
  } catch {
    /* ignore */
  }
  return `${entity}.${method}`;
};

// ---------------------------------------------------------------------------
// WHERE-criteria handling
// ---------------------------------------------------------------------------

const whereHasExplicitTenant = (where: any): boolean => {
  if (!where) return false;
  if (Array.isArray(where)) {
    return where.length > 0 && where.every((w) => whereHasExplicitTenant(w));
  }
  return where[TENANT_COLUMN] !== undefined && where[TENANT_COLUMN] !== null;
};

const scopeWhere = (where: any, tenantId: string, what: string): any => {
  if (!where) return { [TENANT_COLUMN]: tenantId };
  if (Array.isArray(where)) {
    return where.map((w) => scopeWhere(w, tenantId, what));
  }
  const existing = where[TENANT_COLUMN];
  if (existing !== undefined && existing !== null && existing !== tenantId) {
    throw new TenantScopeError(
      `${what}: explicit tenantId differs from the authenticated tenant — cross-tenant access denied`
    );
  }
  return { ...where, [TENANT_COLUMN]: tenantId };
};

/** Guard criteria for find-style calls. Returns the (possibly new) where. */
const guardWhere = (where: any, mode: ScopeMode, what: string): any => {
  if (mode.kind === 'scoped') return scopeWhere(where, mode.tenantId, what);
  // unscoped: only explicitly tenant-qualified criteria may pass
  if (!whereHasExplicitTenant(where)) {
    throw new TenantScopeError(
      `${what}: query without tenant context and without an explicit tenantId. ` +
        `Authenticated paths get context automatically; jobs/scripts must use ` +
        `runWithTenant() or withoutTenantScope().`
    );
  }
  return where;
};

/** Convert primitive id criteria (update/delete/...) into object criteria. */
const normalizeIdCriteria = (
  repo: Repository<ObjectLiteral>,
  criteria: any,
  what: string
): any => {
  if (
    criteria !== null &&
    typeof criteria === 'object' &&
    !Array.isArray(criteria) &&
    !(criteria instanceof Date)
  ) {
    return criteria; // already FindOptionsWhere
  }
  const primaryColumns = repo.metadata.primaryColumns;
  if (primaryColumns.length !== 1) {
    throw new TenantScopeError(
      `${what}: id-style criteria unsupported for composite-key entities under tenant scope — use object criteria`
    );
  }
  const pk = primaryColumns[0].propertyName;
  return Array.isArray(criteria) ? { [pk]: In(criteria) } : { [pk]: criteria };
};

// ---------------------------------------------------------------------------
// Entity (save/insert/remove) handling
// ---------------------------------------------------------------------------

const guardEntities = (
  entityOrEntities: any,
  mode: ScopeMode,
  what: string,
  { requirePresent = false }: { requirePresent?: boolean } = {}
): void => {
  const list = Array.isArray(entityOrEntities)
    ? entityOrEntities
    : [entityOrEntities];
  for (const entity of list) {
    if (!entity || typeof entity !== 'object') continue;
    const current = entity[TENANT_COLUMN];
    if (mode.kind === 'scoped') {
      if (current === undefined || current === null) {
        if (requirePresent) {
          throw new TenantScopeError(
            `${what}: entity has no tenantId — refusing to operate on an unverified row`
          );
        }
        entity[TENANT_COLUMN] = mode.tenantId; // inject
      } else if (current !== mode.tenantId) {
        throw new TenantScopeError(
          `${what}: entity belongs to another tenant — cross-tenant write denied`
        );
      }
    } else {
      // unscoped: explicit tenantId required (e.g. registration creating the
      // first user of a brand-new tenant).
      if (current === undefined || current === null) {
        throw new TenantScopeError(
          `${what}: entity write without tenant context and without an explicit tenantId`
        );
      }
    }
  }
};

// ---------------------------------------------------------------------------
// QueryBuilder guarding (repository.createQueryBuilder only)
// ---------------------------------------------------------------------------

const SELECT_TERMINALS = new Set([
  'getOne',
  'getOneOrFail',
  'getMany',
  'getManyAndCount',
  'getCount',
  'getExists',
  'getRawOne',
  'getRawMany',
  'getRawAndEntities',
  'stream',
  'execute',
]);

const applyQbGuard = (qb: any, what: string): void => {
  if (qb[QB_GUARDED]) return;
  const mode = currentMode();
  if (mode.kind === 'bypass') {
    qb[QB_GUARDED] = true;
    return;
  }

  const expressionMap = qb.expressionMap;
  const queryType: string = expressionMap?.queryType ?? 'select';

  if (mode.kind === 'unscoped') {
    // Heuristic: the built conditions must reference the tenant column.
    const whereDump = JSON.stringify(
      (expressionMap?.wheres ?? []).map((w: any) => w.condition ?? w)
    );
    if (!whereDump.includes(TENANT_COLUMN)) {
      throw new TenantScopeError(
        `${what}: query builder executed without tenant context and without a tenantId predicate`
      );
    }
    qb[QB_GUARDED] = true;
    return;
  }

  // scoped
  if (queryType === 'insert') {
    const values = expressionMap?.valuesSet;
    if (values) guardEntities(values, mode, what);
    qb[QB_GUARDED] = true;
    return;
  }

  if (queryType === 'select') {
    const alias = expressionMap?.mainAlias?.name;
    if (!alias) {
      throw new TenantScopeError(`${what}: query builder has no main alias`);
    }
    qb.andWhere(`${alias}.${TENANT_COLUMN} = :__tenantScopeId`, {
      __tenantScopeId: mode.tenantId,
    });
  } else {
    // update / delete / soft-delete / restore builders take unaliased columns
    qb.andWhere(`${TENANT_COLUMN} = :__tenantScopeId`, {
      __tenantScopeId: mode.tenantId,
    });
  }
  qb[QB_GUARDED] = true;
};

const isQueryBuilderLike = (value: any): boolean =>
  !!value &&
  typeof value === 'object' &&
  typeof value.getQuery === 'function' &&
  !!value.expressionMap;

/**
 * Execute a query-builder terminal on a connection that carries the session
 * stamp (A2b): reuse the builder's active transactional runner if present,
 * otherwise bind a short dedicated transaction around the execution.
 */
const executeQbStamped = async (
  qb: any,
  exec: () => any,
  what: string
): Promise<any> => {
  const stamp = stampFor(currentMode());
  if (!stamp) return exec();

  const existing =
    qb.queryRunner && qb.queryRunner.isTransactionActive
      ? qb.queryRunner
      : undefined;
  if (existing) {
    await stampRunner(existing, stamp);
    return exec();
  }

  const connection = qb.connection;
  const runner = connection.createQueryRunner();
  try {
    await runner.connect();
    await runner.startTransaction();
    await stampRunner(runner, stamp);
    qb.queryRunner = runner;
    const result = await exec();
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
    qb.queryRunner = undefined;
    await runner.release();
  }
};

const wrapQueryBuilder = <T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  what: string
): SelectQueryBuilder<T> => {
  const handler: ProxyHandler<any> = {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, target);
      if (typeof value !== 'function') return value;
      const name = String(prop);
      if (name === 'stream') {
        return (..._args: any[]) => {
          throw new TenantScopeError(
            `${what}: stream() is not supported under tenant scope — use an explicit transaction with runWithTenant()`
          );
        };
      }
      if (SELECT_TERMINALS.has(name)) {
        return (...args: any[]) => {
          applyQbGuard(target, what);
          return executeQbStamped(target, () => value.apply(target, args), what);
        };
      }
      return (...args: any[]) => {
        const result = value.apply(target, args);
        if (result === target) return receiver; // chainable, same builder
        if (isQueryBuilderLike(result)) {
          // .update()/.delete()/.insert()/.subQuery() spawn new builders
          return new Proxy(result, handler);
        }
        return result;
      };
    },
  };
  return new Proxy(qb, handler);
};

// ---------------------------------------------------------------------------
// Repository.prototype patching
// ---------------------------------------------------------------------------

let installed = false;

export const installTenantScope = (): void => {
  if (installed) return;
  installed = true;

  const proto = Repository.prototype as any;

  const patch = (
    method: string,
    wrapper: (original: (...args: any[]) => any) => (...args: any[]) => any
  ): void => {
    const original = proto[method];
    if (typeof original !== 'function') return;
    proto[method] = wrapper(original);
  };

  /** find / findAndCount / count / exists / sum / ... — options.where based */
  const optionsWhereMethods = [
    'find',
    'findAndCount',
    'findOne',
    'findOneOrFail',
    'count',
    'exists',
  ];
  for (const method of optionsWhereMethods) {
    patch(method, (original) =>
      function (this: Repository<ObjectLiteral>, options?: any, ...rest: any[]) {
        if (!isTenantScopedRepo(this)) return original.call(this, options, ...rest);
        const mode = currentMode();
        let opts = options;
        if (mode.kind !== 'bypass') {
          const what = describe(this, method);
          opts = { ...(options ?? {}) };
          opts.where = guardWhere(opts.where, mode, what);
        }
        return withStampedRepository(this, stampFor(mode), (repo) =>
          original.call(repo, opts, ...rest)
        );
      }
    );
  }

  /** findBy / countBy / existsBy / findAndCountBy / findOneBy / ... — bare where */
  const bareWhereMethods = [
    'findBy',
    'findAndCountBy',
    'findOneBy',
    'findOneByOrFail',
    'countBy',
    'existsBy',
  ];
  for (const method of bareWhereMethods) {
    patch(method, (original) =>
      function (this: Repository<ObjectLiteral>, where: any, ...rest: any[]) {
        if (!isTenantScopedRepo(this)) return original.call(this, where, ...rest);
        const mode = currentMode();
        const guarded =
          mode.kind === 'bypass'
            ? where
            : guardWhere(where, mode, describe(this, method));
        return withStampedRepository(this, stampFor(mode), (repo) =>
          original.call(repo, guarded, ...rest)
        );
      }
    );
  }

  /** sum / average / minimum / maximum (column, where) */
  for (const method of ['sum', 'average', 'minimum', 'maximum']) {
    patch(method, (original) =>
      function (this: Repository<ObjectLiteral>, column: any, where?: any, ...rest: any[]) {
        if (!isTenantScopedRepo(this)) return original.call(this, column, where, ...rest);
        const mode = currentMode();
        const guarded =
          mode.kind === 'bypass'
            ? where
            : guardWhere(where, mode, describe(this, method));
        return withStampedRepository(this, stampFor(mode), (repo) =>
          original.call(repo, column, guarded, ...rest)
        );
      }
    );
  }

  /** update / delete / softDelete / restore — criteria first */
  for (const method of ['update', 'delete', 'softDelete', 'restore']) {
    patch(method, (original) =>
      function (this: Repository<ObjectLiteral>, criteria: any, ...rest: any[]) {
        if (!isTenantScopedRepo(this)) return original.call(this, criteria, ...rest);
        const mode = currentMode();
        let guarded = criteria;
        if (mode.kind !== 'bypass') {
          const what = describe(this, method);
          const objCriteria = normalizeIdCriteria(this, criteria, what);
          // never allow an update payload to move a row across tenants
          if (method === 'update' && rest[0] && typeof rest[0] === 'object') {
            const target = rest[0][TENANT_COLUMN];
            if (
              target !== undefined &&
              mode.kind === 'scoped' &&
              target !== mode.tenantId
            ) {
              throw new TenantScopeError(
                `${what}: payload attempts to reassign tenantId — denied`
              );
            }
          }
          guarded = guardWhere(objCriteria, mode, what);
        }
        return withStampedRepository(this, stampFor(mode), (repo) =>
          original.call(repo, guarded, ...rest)
        );
      }
    );
  }

  /** increment / decrement (conditions, prop, value) */
  for (const method of ['increment', 'decrement']) {
    patch(method, (original) =>
      function (this: Repository<ObjectLiteral>, conditions: any, ...rest: any[]) {
        if (!isTenantScopedRepo(this)) return original.call(this, conditions, ...rest);
        const mode = currentMode();
        const guarded =
          mode.kind === 'bypass'
            ? conditions
            : guardWhere(conditions, mode, describe(this, method));
        return withStampedRepository(this, stampFor(mode), (repo) =>
          original.call(repo, guarded, ...rest)
        );
      }
    );
  }

  /** save / insert / upsert / create-style writes — entity based */
  for (const method of ['save', 'insert', 'upsert']) {
    patch(method, (original) =>
      function (this: Repository<ObjectLiteral>, entityOrEntities: any, ...rest: any[]) {
        if (!isTenantScopedRepo(this)) return original.call(this, entityOrEntities, ...rest);
        const mode = currentMode();
        // Tenant creation (registration) is exempt — its PK is the tenantId.
        if (mode.kind !== 'bypass' && !isTenantEntity(this)) {
          guardEntities(entityOrEntities, mode, describe(this, method));
        }
        return withStampedRepository(this, stampFor(mode), (repo) =>
          original.call(repo, entityOrEntities, ...rest)
        );
      }
    );
  }

  /** remove / softRemove / recover — entity must prove its tenant */
  for (const method of ['remove', 'softRemove', 'recover']) {
    patch(method, (original) =>
      function (this: Repository<ObjectLiteral>, entityOrEntities: any, ...rest: any[]) {
        if (!isTenantScopedRepo(this)) return original.call(this, entityOrEntities, ...rest);
        const mode = currentMode();
        if (mode.kind !== 'bypass') {
          guardEntities(entityOrEntities, mode, describe(this, method), {
            requirePresent: true,
          });
        }
        return withStampedRepository(this, stampFor(mode), (repo) =>
          original.call(repo, entityOrEntities, ...rest)
        );
      }
    );
  }

  /** preload — loads by PK internally; verify the loaded row's tenant */
  patch('preload', (original) =>
    async function (this: Repository<ObjectLiteral>, entityLike: any) {
      if (!isTenantScopedRepo(this)) return original.call(this, entityLike);
      const mode = currentMode();
      const result: any = await withStampedRepository(this, stampFor(mode), (repo) =>
        original.call(repo, entityLike)
      );
      if (result && mode.kind !== 'bypass' && !isTenantEntity(this)) {
        if (mode.kind === 'scoped' && result[TENANT_COLUMN] !== mode.tenantId) {
          return undefined; // behave like "not found"
        }
        if (mode.kind === 'unscoped') {
          throw new TenantScopeError(
            `${describe(this, 'preload')}: no tenant context`
          );
        }
      }
      return result;
    }
  );

  /** createQueryBuilder — guard appended at execution time */
  patch('createQueryBuilder', (original) =>
    function (this: Repository<ObjectLiteral>, ...args: any[]) {
      const qb = original.apply(this, args);
      if (!isTenantScopedRepo(this)) return qb;
      return wrapQueryBuilder(qb, describe(this, 'createQueryBuilder'));
    }
  );

  /** raw SQL through a repository — cannot be scoped, so it needs the hatch */
  patch('query', (original) =>
    function (this: Repository<ObjectLiteral>, ...args: any[]) {
      if (currentMode().kind === 'bypass') {
        // still stamp the bypass var so Phase B RLS policies admit the query
        return withStampedRepository(this, { kind: 'bypass' }, (repo) =>
          original.apply(repo, args)
        );
      }
      throw new TenantScopeError(
        `${describe(this, 'query')}: raw SQL bypasses tenant scoping — wrap in withoutTenantScope() if genuinely needed`
      );
    }
  );

  logger.info('🛡️  Tenant scope installed on Repository.prototype (Mission 2 A2a)');
};
