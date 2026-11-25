import type { TBuildPath, TCreateBuildPath } from '@/shared/lib/router/types';

export const createBuildPath: TCreateBuildPath = (routes) => {
  const buildPath: TBuildPath<typeof routes> = (routeName, ...rest) => {
    let path = routes[routeName].path;
    const params: Record<string, string> | undefined = rest[0];

    for (const key in params) {
      path = path.replace(`:${key}`, params[key]);
    }

    return path;
  };

  return buildPath;
};
