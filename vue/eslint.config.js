import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import pluginVue from 'eslint-plugin-vue';
import prettierConfig from 'eslint-config-prettier';

export default defineConfigWithVueTs(
  { name: 'app/ignores', ignores: ['**/dist/**', '**/coverage/**'] },
  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  prettierConfig,
);
