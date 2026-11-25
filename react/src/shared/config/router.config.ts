import type { TRouterConfig } from '@/shared/lib/router/types';

export const routes = {
  article: {
    path: '/article/:id',
    access: 'guest',
    menu: {
      label: 'Article',
    },
  },
  comments: {
    path: '/comments',
    access: 'protected',
    menu: {
      label: 'Comments',
    },
  },
  main: {
    path: '/main',
    redirectTo: '/articles',
  },
} as const satisfies TRouterConfig;
