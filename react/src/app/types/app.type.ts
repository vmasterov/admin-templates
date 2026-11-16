import type { TPageKey, TRouterConfig } from '@/shared/lib/router/types';
import type { ComponentType } from 'react';

export type TPages<Config extends TRouterConfig> = Record<TPageKey<Config>, ComponentType>;
