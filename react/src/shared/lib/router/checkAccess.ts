import type { TCheckAccess } from '@/shared/lib/router/types';

export const checkAccess: TCheckAccess = (guards, accessContext, route) => {
  for (const guard of guards) {
    const redirect = guard(accessContext, route);

    if (redirect) {
      return redirect;
    }
  }

  return null;
};
