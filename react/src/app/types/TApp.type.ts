import type { TPageKey } from '@/shared/lib/router/types';
import type { ComponentType } from 'react';
import type { routes } from '@/shared/config/router.config.ts';

export type TPages = Record<TPageKey<typeof routes>, ComponentType>;
