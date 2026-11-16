import type { TGuard, TRouterConfig } from '@/shared/lib/router/types';
import type { ComponentType } from 'react';
import type { TGetSession } from '@/features/auth/types';
import type { TPages } from '@/app/types';

type TCreateRoutesParams<Config extends TRouterConfig> = {
  routerConfig: Config;
  pages: TPages<Config>;
  layout: ComponentType;
  notFoundPage: ComponentType;
  guards: readonly TGuard<Config>[];
  getSession: TGetSession;
};

export type RouteObject = Record<string, unknown>; // тип из библиотеки

export function createRoutes<Config extends TRouterConfig>(
  params: TCreateRoutesParams<Config>,
): RouteObject[] {
  console.log(params);

  return [] as RouteObject[];
}
