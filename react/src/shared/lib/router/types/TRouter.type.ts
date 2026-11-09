export type TAccess = 'protected' | 'guest' | 'public';

export type TPageRouteMenu = {
  label: string;
};

export type TPageRoute = {
  path: string;
  access: TAccess;
  menu?: TPageRouteMenu;
  redirectTo?: never;
};

export type TRedirectRoute = {
  path: string;
  redirectTo: string;
  access?: never;
  menu?: never;
};

export type TRoute = TPageRoute | TRedirectRoute;

export type TKey<Config extends TRouterConfig> = keyof Config & string;

export type TPageKey<Config extends TRouterConfig> = {
  [K in TKey<Config>]: Config[K] extends TPageRoute ? K : never;
}[TKey<Config>];

export type TRouterConfig = Record<string, TRoute>;

export type TAccessContext = { status: 'guest' } | { status: 'authenticated' };

export type TGuard<Config extends TRouterConfig> = (
  accessContext: TAccessContext,
  route: TPageRoute,
) => TPageKey<Config> | null;

export type TCreateGuard<Config extends TRouterConfig> = (
  redirectTo: TPageKey<Config>,
) => TGuard<Config>;

export type TCheckAccess<Config extends TRouterConfig> = (
  guards: readonly TGuard<Config>[],
  accessContext: TAccessContext,
  route: TPageRoute,
) => TPageKey<Config> | null;

export type TPathParams<Path extends string> = Path extends `${string}:${infer Param}/${infer Rest}`
  ? Param | TPathParams<Rest>
  : Path extends `${string}:${infer Param}`
    ? Param
    : never;

export type TPathArg<Param extends string> = [Param] extends [never]
  ? []
  : [params: Record<Param, string>];

export type TBuildPath<Config extends TRouterConfig> = <RouteName extends TKey<Config>>(
  routeName: RouteName,
  ...params: TPathArg<TPathParams<Config[RouteName]['path']>>
) => string;

export type TCreateBuildPath = <Config extends TRouterConfig>(routes: Config) => TBuildPath<Config>;
