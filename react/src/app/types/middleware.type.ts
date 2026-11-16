import type { TBuildPath, TGuard, TPageRoute, TRouterConfig } from '@/shared/lib/router/types';
import type { TGetSession } from '@/features/auth/types';

export type GuardMiddleware = Record<string, unknown>; // тип из роутера

export type TCreateGuardMiddleware<Config extends TRouterConfig> = (
  route: TPageRoute,
  guards: readonly TGuard<Config>[],
  buildPath: TBuildPath<Config>,
) => GuardMiddleware;

export type TAuthMiddleware = Record<string, unknown>; // тип из роутера

export type TCreateAuthMiddleware = (getSession: TGetSession) => TAuthMiddleware;
