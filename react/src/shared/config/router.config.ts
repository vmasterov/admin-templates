import type { TRouterConfig } from '@/shared/lib/router/types';

export const routes = {
  article: {
    path: 'string',
    access: 'guest',
  },
  comments: {
    path: 'string',
    access: 'protected',
    menu: {
      label: 'string',
    },
  },
  main: {
    path: 'string',
    redirectTo: '/test/redirect',
  },
} as const satisfies TRouterConfig;
