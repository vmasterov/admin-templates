# Настройка React-проекта (Vite)

Пошаговая инструкция с пояснениями. Проект `react/` — автономная часть репозитория `admin-templates`:
свой `package.json`, свои настройки, его можно вынести в отдельный репозиторий.

> _(Справка: блоки «Раньше» описывают, как было в исходной инструкции `vite-react-setup` и почему
> мы это изменили. Основной текст — всегда актуальное состояние проекта.)_

---

## Чеклист

- ✅ Создание проекта
- ✅ Структура папок
- ✅ Алиасы путей (@/...)
- ✅ ESLint + Prettier
- ✅ Git-хуки: lefthook + branch-name + commit-msg
- ✅ Vitest
- ✅ env-config.js (runtime переменные)
- ✅ nginx.conf
- ✅ Dockerfile

> _(Раньше: «FSD структура папок» и «husky + lint-staged + commit-msg». Изменили — см. шаги 2 и 5.)_

---

## Запуск готового проекта

Нужен Node.js 22+. npm-команды выполняются в папке `react/`, git-команды — из любого места репозитория.

```bash
cd react
npm install
npm run dev        # http://127.0.0.1:3000
```

---

## Шаг 1 — Создание проекта

Создаёт базовую структуру с React + TypeScript + Vite. Выполняется **из корня репозитория**:

```bash
npm create vite@latest react -- --template react-ts
cd react
npm install
npm run dev
```

> ⚠ Не делай `git init` внутри `react/`. Репозиторий один — в корне `admin-templates`. Вложенный
> репозиторий спрячет файлы проекта от корневого.

> _(Раньше: `npm create vite@latest vite-react-setup-01` — проект был отдельным репозиторием.
> Теперь React и Vue лежат в одном репозитории как независимые папки, чтобы держать оба проекта и
> общий регламент в `docs/` в одном месте.)_

> ⚠ Windows: localhost может не открываться — резолвится в IPv6 ::1 вместо 127.0.0.1

Исправление — добавить в vite.config.ts:

```typescript
server: {
  host: '127.0.0.1',
  port: 3000,
}
```

### Переименовать пакет

В `package.json` поменять `"name": "react"` на `"react-admin"`.

Пакет с тем же именем, что и его зависимость, ломает установку: `npm i react@...` упадёт с ошибкой
`ENOSELF` («Refusing to install package with name "react" under a package also called "react"»).

---

## Шаг 2 — Структура папок

Упрощённая слоистая структура. Каждый слой имеет чёткую зону ответственности.

**WINDOWS:**

```powershell
mkdir src\app, src\pages, src\features, src\shared
mkdir src\shared\ui, src\shared\api, src\shared\lib, src\shared\config
```

**UNIX:**

```bash
mkdir -p src/{app,pages,features,shared/{ui,api,lib,config}}
```

| Слой           | Зона ответственности                                                 |
| -------------- | -------------------------------------------------------------------- |
| app/           | Точка входа, провайдеры, роутер, глобальные стили                    |
| pages/         | Страницы приложения — собирают features и shared                     |
| features/      | Бизнес-фичи (авторизация, пользователи): UI + хуки                   |
| shared/lib/    | Чистые TS-функции без React — переносятся во Vue-проект копированием |
| shared/ui/     | Переиспользуемые компоненты (Modal, DataTable…)                      |
| shared/api/    | HTTP-клиент                                                          |
| shared/config/ | Конфигурация (переменные окружения)                                  |

**Правило импортов:** только сверху вниз — `app → pages → features → shared`. Нижний слой ничего не
знает о верхних. `shared/lib` не импортирует ни React, ни Vue.

**Проверка ядра:** если `shared/lib` переносится во Vue-проект без единой правки — логика отделена
от фреймворка правильно. Понадобилась правка — в ядро протекла зависимость от фреймворка.

> _(Раньше: Feature-Sliced Design — слои app, pages, widgets, features, entities, shared.
> Отказались: для шаблона админки слои `widgets` и `entities` избыточны, а строгие правила FSD
> отвлекают от главной цели — разделения логики на core / хук / компонент.)_

---

## Шаг 3 — Алиасы путей

Позволяет писать `@/shared/ui/Button` вместо `../../shared/ui/Button`.

Vite поддерживает алиасы из tsconfig нативно через опцию `resolve.tsconfigPaths`. Отдельный пакет
`vite-tsconfig-paths` больше не нужен.

### vite.config.ts

```typescript
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  // Windows: localhost может не открываться — резолвится в IPv6 ::1 вместо 127.0.0.1
  server: {
    host: '127.0.0.1',
    port: 3000,
  },
});
```

### tsconfig.app.json — добавить в compilerOptions

```json
"strict": true,
"paths": { "@/*": ["./src/*"] }
```

**Почему без baseUrl:**

Начиная с TypeScript 4.1 `paths` работает без `baseUrl` — пути считаются относительно файла
`tsconfig`, поэтому пишем `./src/*`. В TypeScript 6.0 `baseUrl` объявлен устаревшим, так что
проще его не использовать вовсе — тогда не нужен и `ignoreDeprecations`.

> _(Раньше: `"ignoreDeprecations": "6.0"`, `"baseUrl": "."`, `"paths": { "@/*": ["src/*"] }`.
> Считалось, что без `baseUrl` `paths` не работает — это верно только для TypeScript до 4.1.
> `ignoreDeprecations` лишь глушил предупреждение и сломался бы в TypeScript 7, где `baseUrl` удалят.)_

**Зачем strict:**

`strict` включает строгие проверки: запрет неявного `any`, проверку `null`/`undefined` и т.д.
В TypeScript 6 он включён по умолчанию, но пишем явно — конфиг не зависит от версии и понятен
без знания дефолтов.

---

## Шаг 4 — ESLint + Prettier

| Инструмент             | Зона ответственности                              |
| ---------------------- | ------------------------------------------------- |
| ESLint                 | Качество кода — баги, плохие паттерны, логика     |
| Prettier               | Форматирование — отступы, кавычки, длина строки   |
| eslint-config-prettier | Отключает ESLint правила конфликтующие с Prettier |

### Установка

```bash
npm install -D prettier eslint-config-prettier
```

### .prettierrc

```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

### eslint.config.js — добавить импорт и последним в extends

```javascript
import prettierConfig from 'eslint-config-prettier';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettierConfig, // всегда последним
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
]);
```

Все настройки форматирования — только в `.prettierrc`. ESLint не трогаем.

### Скрипты в package.json

```json
"scripts": {
  "lint": "eslint",
  "format": "prettier --write"
}
```

**Почему без точки (`.`):** git-хук передаёт скриптам список изменённых файлов
(`npm run lint -- src/App.tsx`). Со скриптом `"eslint ."` получилось бы `eslint . src/App.tsx` —
проверка всего проекта вместо изменённых файлов.

- `eslint` без аргументов проверяет всю папку, с аргументами — только переданные файлы.
- `prettier --write` без аргументов падает («No parser and no file path given»). Весь проект
  форматируется отдельной командой: `npx prettier --write .`

> _(Раньше: `"lint": "eslint ."`, скрипта `format` не было — форматирование запускал lint-staged.
> Изменили вместе с переходом на lefthook, см. шаг 5.)_

### Решения

- **`max-lines: 180` — рекомендация, а не правило ESLint.** Автоматическая проверка подталкивает
  делить файлы искусственно, ради цифры. Размер файла контролируем на ревью.
- **Без `--fix` в git-хуке.** Хук — честная проверка: ошибку видно, правило запоминается.
  Автоисправление — в редакторе при сохранении, на глазах (ниже).

### Форматирование при сохранении и потере фокуса (WebStorm)

**Цель настройки:**

| Действие              | Результат                  |
| --------------------- | -------------------------- |
| Cmd+S / Ctrl+S        | Сохраняет + форматирует ✅ |
| Переход в другое окно | Сохраняет + форматирует ✅ |
| Пауза в печати        | Ничего не происходит ✅    |

**1. Отключить автосохранение по таймауту**

Путь: `Settings → Appearance & Behavior → System Settings`

| Параметр                                                      | Значение    |
| ------------------------------------------------------------- | ----------- |
| Save files automatically if application is idle for N seconds | ☐ ОТКЛЮЧИТЬ |
| Save files on frame deactivation                              | ☑ ВКЛЮЧИТЬ  |

Первая опция вызывает сохранение при паузе в печати — это мешает. Вторая опция сохраняет файл при переключении на другое окно (браузер, терминал и т.д.).

**2. Настроить Prettier**

Путь: `Settings → Languages & Frameworks → Prettier`

| Параметр         | Значение                                |
| ---------------- | --------------------------------------- |
| Prettier package | node_modules/prettier (автоопределение) |
| Run for files    | \*\*/\*.{js,ts,jsx,tsx,css,html}        |
| Run on save      | ☑ ВКЛЮЧИТЬ                              |
| Run on reformat  | ☐ ОТКЛЮЧИТЬ                             |

WebStorm найдёт Prettier автоматически если он установлен в проекте. Run on save — форматирует файл при каждом сохранении (Cmd+S и потеря фокуса).

> ⚠ Run on reformat лучше отключить — иначе Prettier будет запускаться дважды: один раз через Reformat code и второй раз через Run on save.

**3. Настроить ESLint**

Путь: `Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint`

| Параметр                 | Значение                         |
| ------------------------ | -------------------------------- |
| Конфигурация             | ● Automatic ESLint configuration |
| Run eslint --fix on save | ☑ ВКЛЮЧИТЬ                       |

Automatic configuration — WebStorm сам найдёт eslint.config.js в проекте. Run eslint --fix on save — автоматически исправляет ошибки линтера при сохранении.

**4. Actions on Save (альтернативный способ)**

Путь: `Settings → Tools → Actions on Save`

| Параметр         | Значение   |
| ---------------- | ---------- |
| Reformat code    | ☑ ВКЛЮЧИТЬ |
| Optimize imports | ☑ ВКЛЮЧИТЬ |
| Run eslint --fix | ☑ ВКЛЮЧИТЬ |
| Run Prettier     | ☑ ВКЛЮЧИТЬ |

Actions on Save — это единое место где собраны все действия при сохранении. Если настроил шаги 2 и 3, дублировать здесь не обязательно. Но Reformat code и Optimize imports доступны только здесь.

**Важный нюанс: Cmd+S vs потеря фокуса**

"On save" в WebStorm — это не только Cmd+S. Если включена опция "Save files on frame deactivation" (пункт 1), то переключение на другое окно тоже считается сохранением.

Цепочка событий при потере фокуса:

```
Переключился на браузер
  → WebStorm: "Save files on frame deactivation"
  → Файл сохраняется
  → Срабатывает "on save"
  → ESLint --fix + Prettier запускаются
  → Файл отформатирован ✅
```

Цепочка событий при паузе в печати:

```
Перестал печатать на 3 секунды
  → Опция "Save files automatically" ОТКЛЮЧЕНА
  → Файл НЕ сохраняется
  → Ничего не происходит ✅
```

**Проверка:**

1. Открой любой .tsx файл
2. Напечатай код с нарушением форматирования
3. Сделай паузу — ничего не происходит ✅
4. Нажми Cmd+S — файл отформатировался ✅
5. Переключись на браузер и обратно — файл отформатировался ✅

### Что может и чего не может Prettier и ESLint

**Сводная таблица:**

| Инструмент   | Что делает                                                 | Синтаксис       |
| ------------ | ---------------------------------------------------------- | --------------- |
| Prettier     | Форматирование: отступы, пробелы, кавычки, длина строк     | Только валидный |
| ESLint --fix | Паттерны: == → ===, var → const, неиспользуемые переменные | Только валидный |
| TypeScript   | Подчёркивает ошибки в реальном времени                     | Любой           |

> ⚠ Сломанный синтаксис = Prettier не может распарсить файл и ничего не делает. Исправление синтаксических ошибок — задача разработчика.

**Что исправляет Prettier (форматирование):**

Prettier работает только с синтаксически валидным кодом. Он не меняет логику — только внешний вид.

ДО сохранения:

<!-- prettier-ignore -->
```typescript
const user={name:"John",age:30,city:"Moscow"}
function   greet(  name:string   ){return `Hello, ${name}`}
const arr=[1,2,
    3,4,
            5]
```

ПОСЛЕ сохранения — Prettier исправит:

```typescript
const user = { name: 'John', age: 30, city: 'Moscow' };
function greet(name: string) {
  return `Hello, ${name}`;
}
const arr = [1, 2, 3, 4, 5];
```

Prettier исправляет: отступы, пробелы, кавычки (двойные → одинарные), запятые в конце, длину строк, скобки.

**Что исправляет ESLint --fix (паттерны):**

ESLint находит плохие паттерны и исправляет только те, которые можно исправить безопасно:

<!-- prettier-ignore -->
```typescript
// ДО — ESLint исправит
if (x == 1) {}         // → if (x === 1) {}
var name = 'test';     // → const name = 'test'

// ESLint подсветит, но НЕ исправит
let unused = 5;        // предупреждение: unused variable
```

**Что НЕ исправят ни Prettier ни ESLint:**

Синтаксические ошибки — это сломанный код, который невозможно распарсить:

Пропущенные запятые:

```typescript
const obj = {
  name: "John"     // ← нет запятой
  age: 30          // ← нет запятой
  city: "Moscow"
}
```

Незакрытые скобки:

```typescript
function test() {
  console.log("hello"
}
```

Опечатки в именах:

```typescript
const naem = 'John'; // хотел name
consol.log('test'); // хотел console
```

Синтаксические ошибки подсвечивает TypeScript в редакторе (красное подчёркивание). Исправлять их — задача разработчика.

> ⚠ Если после переключения на браузер код не изменился — проверь настройки WebStorm: Save files on frame deactivation, Prettier Run on save, ESLint --fix on save.

---

## Шаг 5 — Git-хуки: lefthook + branch-name + commit-msg

| Инструмент                      | Назначение                                                              |
| ------------------------------- | ----------------------------------------------------------------------- |
| lefthook                        | Перехватывает git события (pre-commit, commit-msg) и запускает проверки |
| `scripts/git-hooks/branch-name` | Проверяет имя ветки, запрещает коммит в main/develop                    |
| `scripts/git-hooks/commit-msg`  | Проверяет формат сообщения коммита                                      |
| скрипты проекта                 | `format`, `lint`, `test:related`, `build` — сами проверки               |

### 5.1 — Почему lefthook

Git-хуки — механизм git, поэтому они всегда живут в **корне репозитория**, а не в папке проекта.
В репозитории два проекта (`react/`, `vue/`), и мы хотим, чтобы они оставались независимыми.

| Требование                                   | Как решает lefthook                                                 |
| -------------------------------------------- | ------------------------------------------------------------------- |
| Корень без `package.json` и `node_modules`   | Ставится одним бинарником через brew                                |
| Проверять только изменённый проект           | Опции `root` и `glob`: задача запускается, если изменились её файлы |
| Проверять только изменённые файлы            | Шаблон `{staged_files}` — список застейдженных файлов               |
| Проект легко вынести в отдельный репозиторий | Переносится блок из `lefthook.yml`, сам проект не меняется          |

> _(Раньше: husky + lint-staged внутри одного проекта. Для репозитория с двумя проектами husky
> потребовал бы `package.json` и `node_modules` в корне, а lint-staged — общую конфигурацию для обоих
> проектов. Это связывало бы проекты между собой.)_

### 5.2 — Установка

```bash
brew install lefthook   # один раз на компьютер, глобально
cd admin-templates      # корень репозитория
lefthook install        # в этом репозитории
```

- `brew install` ставит программу на компьютер.
- `lefthook install` ничего не ставит в проект: он записывает в `.git/hooks` маленькие скрипты,
  которые при коммите вызывают lefthook, а тот читает `lefthook.yml`.

> ⚠ Папка `.git/hooks` не хранится в git. После **каждого нового клона** (другой компьютер, другой
> человек) обе команды нужно выполнить заново.

> ⚠ Если раньше в репозитории был настроен `core.hooksPath`, lefthook откажется устанавливаться.
> Снять настройку: `git config --unset core.hooksPath`

> ⚠ Если после изменения `lefthook.yml` появился новый тип хука (например, `commit-msg`) —
> снова выполни `lefthook install`, иначе хук не будет установлен.

> _(Раньше: `git init` → `npm install -D husky lint-staged` → `npx husky init`. Husky сам добавлял
> `"prepare": "husky"` в `package.json`, и хуки ставились автоматически при `npm install`. Это
> удобство потеряли сознательно — ради корня без npm.)_

### 5.3 — Vitest

```bash
npm install -D vitest
```

Добавить в package.json секцию scripts:

```json
"scripts": {
  "test": "vitest",
  "test:related": "vitest related --run --passWithNoTests"
}
```

| Команда                         | Назначение                                         |
| ------------------------------- | -------------------------------------------------- |
| npm run test                    | watch mode — для локальной разработки              |
| npm run test:related -- <файлы> | один прогон тестов, связанных с файлами — для хука |

**`related`** — подкоманда Vitest. Получает список изменённых файлов, строит граф импортов и запускает
только тесты, которые эти файлы импортируют — напрямую или по цепочке. Поменял `sort.ts` —
запустятся `sort.test.ts` и тесты модулей, использующих `sort.ts`. Коммит остаётся быстрым.

**`--run`** — выключает режим наблюдения. Без него Vitest после прогона ждёт изменений, и хук никогда
не завершится.

**`run` и `--run`:** `vitest run` — подкоманда «один прогон», `--run` — флаг. В команде может быть
только одна подкоманда; у `related` место подкоманды занято, поэтому режим выключается флагом.
`vitest run` и `vitest --run` работают одинаково.

**`--passWithNoTests`** — не падать, если тестов нет (начало проекта или файл без тестов).

> ⚠ `--passWithNoTests` не спасает, если Vitest не установлен: тогда скрипт упадёт с
> `vitest: command not found`. Сначала ставим Vitest, потом коммитим.

> _(Раньше: `"test:run": "vitest --run --passWithNoTests"` — на каждом коммите прогонялись все тесты.
> С `related` запускаются только нужные.)_

### 5.4 — lefthook.yml (в корне репозитория)

```yaml
pre-commit:
  piped: true
  jobs:
    - name: branch-name
      run: bash scripts/git-hooks/branch-name
    - name: projects
      group:
        parallel: true
        jobs:
          - name: react
            root: 'react/'
            glob: '*.{ts,tsx}'
            group: &checks
              piped: true
              jobs:
                - name: format
                  stage_fixed: true
                  run: npm run format -- {staged_files}
                - name: lint
                  run: npm run lint -- {staged_files}
                - name: test
                  run: npm run test:related -- {staged_files}
                - name: build
                  run: npm run build
          - name: vue
            root: 'vue/'
            glob: '*.{ts,vue}'
            group: *checks
commit-msg:
  jobs:
    - name: commit-msg
      run: bash scripts/git-hooks/commit-msg {1}
```

**Разбор:**

| Опция                | Что делает                                                           |
| -------------------- | -------------------------------------------------------------------- |
| `piped: true`        | Задачи по очереди; если одна упала — следующие не запускаются        |
| `parallel: true`     | Задачи одновременно (React и Vue проверяются параллельно)            |
| `group`              | Вложенная группа задач со своим режимом выполнения                   |
| `root: "react/"`     | Команда выполняется внутри папки проекта                             |
| `glob: "*.{ts,tsx}"` | Задача запускается, только если среди застейдженных есть такие файлы |
| `{staged_files}`     | Подставляет застейдженные файлы (пути — относительно `root`)         |
| `stage_fixed: true`  | После задачи снова делает `git add` для обработанных файлов          |
| `{1}`                | Первый аргумент, который git передал хуку                            |

**Порядок:** сначала проверяется ветка — если имя неверное, линт, тесты и сборка даже не запускаются.
Внутри проекта — `format → lint → test → build` по очереди: ESLint не должен читать файл в момент,
когда Prettier его перезаписывает.

**Якоря YAML** `&checks` / `*checks`: блок проверок описан один раз и подставлен по ссылке для Vue.
Различаются только `root` и `glob`. Это работает, потому что оба проекта предоставляют одинаковый
контракт — скрипты `format`, `lint`, `test:related`, `build`. Хуку неважно, как проект их реализует
(принцип инверсии зависимостей — D из SOLID). Цена: при выносе Vue в отдельный репозиторий `*checks`
нужно заменить полным блоком. Итоговый конфиг с подставленными якорями: `lefthook dump`.

**`npm run` вместо `npx`:** `npm run` запускает скрипт проекта по имени. Проект сам решает, как
линтить и тестировать, а `npx` при отсутствии пакета пытается скачать его из сети и может зависнуть
на вопросе «установить?».

**`--` перед аргументами:** всё после `--` npm передаёт скрипту. Без него npm забрал бы флаги себе.

**Зачем `stage_fixed`:** коммит берёт файлы из индекса (снимок после `git add`), а не из рабочей
папки. Хук срабатывает уже после `git add`, поэтому правки Prettier остаются только в рабочей папке —
в коммит ушёл бы неотформатированный код. `stage_fixed` заново добавляет обработанные файлы в индекс.
У `lint` флаг не нужен — он только проверяет.

**Сборка на pre-commit**, а не на pre-push: коммит и пуш обычно делаются сразу друг за другом.

> _(Раньше: всё в одном скрипте `.husky/pre-commit` — проверка ветки, `npx lint-staged`,
> `npm run test:run`, `npm run build` и `rm -rf dist`. Теперь проверка ветки — отдельный скрипт,
> остальное — задачи lefthook. `rm -rf dist` убрали: `dist` и так в `.gitignore`.)_

### 5.5 — scripts/git-hooks/branch-name

```bash
#!/usr/bin/env bash

readonly RED=$'\033[31m'
readonly GREEN=$'\033[32m'
readonly YELLOW=$'\033[33m'
readonly NC=$'\033[0m'

# Пропустить проверку ветки при первом коммите (HEAD ещё не существует)
if ! git rev-parse HEAD > /dev/null 2>&1; then
  echo "Первый коммит — проверка ветки пропущена"
  exit 0
fi

branch="$(git rev-parse --abbrev-ref HEAD)"

# Запрет коммита в main/develop
if [ "$branch" = "main" ] || [ "$branch" = "develop" ]; then
  echo "${RED}❌ Нельзя коммитить напрямую в ветку ${YELLOW}$branch${NC}"
  exit 1
fi

# Проверка имени ветки
if echo "$branch" | grep -qE '^(feature|bugfix|hotfix|refactor|release|chore|docs|test|perf|ci)/'; then
  echo "${GREEN}✅ Имя ветки верное${NC}"
elif echo "$branch" | grep -qE '^merge/develop[0-9]*-develop[0-9]*$'; then
  echo "${GREEN}✅ Имя ветки merge верное${NC}"
else
  echo "${RED}❌ Неверное имя ветки${NC}"
  echo ""
  echo "Допустимые форматы:"
  echo "  <type>/<description>"
  echo ""
  echo "Допустимые типы:"
  echo "  ${GREEN}feature${NC}   - новая функциональность"
  echo "  ${GREEN}bugfix${NC}    - исправление багов"
  echo "  ${GREEN}hotfix${NC}    - срочное исправление"
  echo "  ${GREEN}refactor${NC}  - рефакторинг кода"
  echo "  ${GREEN}release${NC}   - подготовка релиза"
  echo "  ${GREEN}chore${NC}     - вспомогательные задачи"
  echo "  ${GREEN}docs${NC}      - изменения в документации"
  echo "  ${GREEN}test${NC}      - добавление тестов"
  echo "  ${GREEN}perf${NC}      - улучшение производительности"
  echo "  ${GREEN}ci${NC}        - изменения в CI/CD"
  echo ""
  echo "Примеры:"
  echo "  feature/add-auth-page"
  echo "  bugfix/fix-login-error"
  echo "  chore/update-dependencies"
  echo ""
  echo "Ваша ветка:"
  echo "  $branch"
  echo ""
  exit 1
fi
```

Что делает скрипт:

1. Пропускает проверку при первом коммите (см. «Ошибка: первый коммит»)
2. Запрещает коммит напрямую в main/develop — изменения попадают туда через pull request
3. Проверяет имя ветки (feature/, bugfix/, hotfix/, refactor/, release/, chore/, docs/, test/, perf/, ci/)

Скрипт вызывается как `bash scripts/git-hooks/branch-name`: синтаксис `$'\033[...]'` для цветов есть
только в bash, в `sh` он не работает.

### 5.6 — scripts/git-hooks/commit-msg

```bash
#!/usr/bin/env bash

# Определение цветов
readonly RED=$'\033[31m'
readonly GREEN=$'\033[32m'
readonly YELLOW=$'\033[33m'
readonly NC=$'\033[0m'

message="$(head -n1 "$1")"
required_pattern="^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(\(.+\))?: .+"

if ! echo "$message" | grep -qE "$required_pattern"; then
  echo "❌ Неверный формат сообщения коммита. Сообщение коммита должно соответствовать Conventional Commits:"
  echo "<type>[optional scope]: <description>"
  echo ""
  echo "Допустимые типы:"
  echo "  ${GREEN}feat${NC}     - новая функциональность"
  echo "  ${GREEN}fix${NC}      - исправление багов"
  echo "  ${GREEN}docs${NC}     - изменения в документации"
  echo "  ${GREEN}style${NC}    - форматирование, отсутствующие точки с запятой и т.д."
  echo "  ${GREEN}refactor${NC} - рефакторинг кода"
  echo "  ${GREEN}perf${NC}     - улучшение производительности"
  echo "  ${GREEN}test${NC}     - добавление тестов"
  echo "  ${GREEN}chore${NC}    - обновление сборки, вспомогательные инструменты"
  echo "  ${GREEN}build${NC}    - изменения в системе сборки"
  echo "  ${GREEN}ci${NC}       - изменения в CI/CD"
  echo "  ${GREEN}revert${NC}   - откат предыдущих изменений"
  echo ""
  echo "Примеры:"
  echo "  feat: добавлена новая страница авторизации"
  echo "  fix(auth): исправлена ошибка валидации пароля"
  echo "  docs: обновлена документация API"
  echo "  refactor(components): переписан компонент Button"
  echo ""
  echo "Ваше сообщение коммита:"
  echo "  $message"
  echo ""
  echo "Для получения дополнительной информации проверьте скрипт в scripts/git-hooks/commit-msg"
  exit 1
fi

exit 0
```

Проверяет формат сообщения по Conventional Commits:

```
<type>[optional scope]: <description>
```

| Тип      | Назначение                     |
| -------- | ------------------------------ |
| feat     | Новая функциональность         |
| fix      | Исправление багов              |
| docs     | Изменения в документации       |
| style    | Форматирование                 |
| refactor | Рефакторинг кода               |
| perf     | Улучшение производительности   |
| test     | Добавление тестов              |
| chore    | Обновление сборки, инструменты |
| build    | Изменения в системе сборки     |
| ci       | Изменения в CI/CD              |
| revert   | Откат предыдущих изменений     |

**Откуда берётся `$1`:** перед коммитом git сохраняет текст сообщения в `.git/COMMIT_EDITMSG` и
вызывает хук с путём к этому файлу первым аргументом. Цепочка: git → хук lefthook → шаблон `{1}` в
`lefthook.yml` → `$1` в скрипте. Без `{1}` переменная `$1` пустая, `head` падает, и отклоняется
любой коммит.

**Почему `head -n1`:** `grep` проверяет текст построчно — `^` и `$` означают начало и конец каждой
строки, а не всего сообщения. Если проверять весь текст, коммит пройдёт, когда подходит любая строка,
в том числе из тела. Проверяем только первую строку — заголовок коммита.

```
Merge pull request #1 from x        ← заголовок не по формату

chore: добавлены git-хуки           ← строка из тела
```

```
cat "$1"     | grep → ПРОШЛО   ❌ (совпала строка из тела)
head -n1 "$1" | grep → ОТКЛОНЕНО ✅
```

> ⚠ Сообщения, которые генерирует сам git (`Merge branch ...`, `Revert "..."`, `fixup! ...`), не
> соответствуют формату и будут отклонены. Пока ветки мёрджатся через pull request на GitHub, это не
> мешает: merge-коммит создаётся на сервере, где хуки не запускаются. Если понадобятся локальные
> merge/revert — добавить в скрипт пропуск по началу сообщения: `^(Merge |Revert "|fixup! |squash! |amend! )`.

> _(Раньше: `message="$(cat "$1")"` — проверялось всё сообщение. Из-за этого `git commit --amend
--no-edit` поверх merge-коммита прошёл проверку: в его теле была строка `chore: ...`.)_

### 5.7 — Порядок выполнения при коммите

```
git commit -m "feat: new feature"
  |
  +-- pre-commit (по очереди):
  |     1. branch-name — проверка имени ветки
  |     2. для каждого изменённого проекта (React и Vue — параллельно):
  |          format → lint → test:related → build
  |
  +-- commit-msg:
        3. Проверка формата сообщения (первая строка)

Любой шаг упал -> коммит отклонён
```

### Ошибка: первый коммит

```
git commit -m "init"
fatal: ambiguous argument 'HEAD': unknown revision or path
not in the working tree.
```

**Причина:**

В скрипте `branch-name` есть строка:

```bash
branch="$(git rev-parse --abbrev-ref HEAD)"
```

`git rev-parse HEAD` требует хотя бы один коммит в истории. При первом коммите HEAD не существует — Git не знает на что он указывает.

**Решения:**

**Способ 1 — Пропустить проверки для первого коммита (быстрый)**

Флаг `--no-verify` говорит Git пропустить все хуки (pre-commit и commit-msg) только для этого коммита:

```bash
git commit -m "init" --no-verify
```

> ⚠ Используй --no-verify с осторожностью — он полностью отключает все проверки. Подходит только для первого коммита. Не используй его постоянно — это обходит линтер, тесты и проверку сообщения.

**Способ 2 — Добавить проверку в скрипт (правильный, уже сделано)**

В начале скрипта `branch-name` (после определения цветов, до git rev-parse):

```bash
# Пропустить проверку ветки при первом коммите (HEAD ещё не существует)
if ! git rev-parse HEAD > /dev/null 2>&1; then
  echo "Первый коммит — проверка ветки пропущена"
  exit 0
fi
```

Как это работает:

```
git rev-parse HEAD > /dev/null 2>&1
  │
  ├─ HEAD существует → код 0 → ! делает false → блок пропускается
  │   → скрипт продолжает полную проверку
  │
  └─ HEAD не существует → код 1 → ! делает true → блок выполняется
      → проверка ветки пропускается, lefthook продолжает остальные задачи
```

`> /dev/null 2>&1` — подавляет вывод ошибки в терминал. Без этого пользователь увидит "fatal: ambiguous argument" перед сообщением о первом коммите.

> _(Раньше: внутри блока ещё был `npx lint-staged` — скрипт сам запускал линт перед выходом.
> Теперь линт — отдельная задача lefthook, и она выполняется независимо от проверки ветки.)_

**Рекомендация:** Способ 2 предпочтительнее — он решает проблему навсегда. Способ 1 — быстрый обход, но пропускает все проверки.

---

## Шаг 6 — Runtime Environment Injection

### Зачем

Vite вшивает переменные (`VITE_API_URL`) в бандл на этапе сборки. Это значит для каждого окружения (dev, staging, prod) нужна отдельная сборка.

Runtime Environment Injection решает эту проблему — переменные подставляются при запуске контейнера, не при сборке. Один Docker образ для всех окружений.

### Как работает

| Окружение | Как формируется env-config.js                          |
| --------- | ------------------------------------------------------ |
| Локально  | Файл public/env-config.js с захардкоженными значениями |
| Docker    | Entrypoint скрипт генерирует файл из ENV переменных    |

Приложение не знает откуда взялся файл — оно всегда читает `window.__env__`.

**Локальная разработка:**

```
public/env-config.js (захардкожен)
  → браузер загружает файл
  → window.__env__ доступен в приложении
```

**Продакшн (Docker):**

```
docker run -e API_URL=https://api.prod.com my-app
  → entrypoint берёт ENV переменные
  → генерирует env-config.js
  → nginx раздаёт файл браузеру
  → window.__env__ доступен в приложении
```

> ⚠ Имя `__env__` должно совпадать во всех четырёх файлах и в `docker-entrypoint.sh`. При
> расхождении ошибки не будет: в Docker приложение молча возьмёт дефолтные значения.

> _(Раньше: `window._env_` (одно подчёркивание). В проекте имена разошлись: entrypoint писал
> `_env_`, а приложение читало `__env__` — переменные из Docker не доходили. Привели всё к `__env__`.)_

**Порты:** dev-сервер — `3000`, API по умолчанию — `http://localhost:3001`.

> _(Раньше: API по умолчанию тоже был на `3000` — совпадал с портом dev-сервера.)_

### Алгоритм создания (4 файла)

#### Файл 1 — public/env-config.js

```javascript
window.__env__ = Object.freeze({
  API_URL: 'http://localhost:3001',
});
```

#### Файл 2 — index.html (подключить перед main.tsx)

```html
<script src="/env-config.js"></script>
<script type="module" src="/src/main.tsx"></script>
```

#### Файл 3 — src/shared/config/env.ts (хелпер)

```typescript
const env = window.__env__ ?? {
  API_URL: 'http://localhost:3001',
};

export const API_URL = env.API_URL;
```

Зачем: вместо `window.__env__.API_URL` пишешь `import { API_URL } from '@/shared/config/env'`. Автокомплит, одно место для изменений, дефолтные значения.

#### Файл 4 — src/global.d.ts (типы)

```typescript
export type {};

declare global {
  interface EnvConfig {
    API_URL: string;
  }

  interface Window {
    __env__?: EnvConfig;
  }
}
```

Зачем: TypeScript не знает про `window.__env__`. Этот файл объявляет тип, иначе редактор покажет ошибку.

### Почему файл типов называется global.d.ts а не env.d.ts

TypeScript обрабатывает `.d.ts` файлы в двух режимах:

**Companion declaration (типы модуля):**
Когда в одной папке лежат `env.ts` и `env.d.ts`, TypeScript считает что `env.d.ts` — это типы для модуля `env.ts`. Глобальные декларации внутри такого файла игнорируются.

```
shared/config/
  env.ts      ← модуль
  env.d.ts    ← TypeScript думает: "это типы для env.ts" ❌
```

**Ambient declaration (глобальные типы):**
Когда `.d.ts` файл не совпадает по имени ни с одним `.ts` файлом — TypeScript считает его глобальным.

```
src/
  global.d.ts   ← нет global.ts → файл глобальный ✅
  shared/config/
    env.ts
```

**Правило:**

```
foo.ts + foo.d.ts  → d.ts привязан к модулю (не глобальный) ❌
foo.ts + bar.d.ts  → d.ts глобальный (разные имена) ✅
```

> ⚠ Никогда не называй .d.ts файл так же как .ts файл в той же папке, если хочешь глобальные декларации.

### Почему нужны export type {} и declare global

В `tsconfig.app.json` есть две опции которые влияют на обработку `.d.ts` файлов:

**`moduleDetection: "force"`** — Все файлы считаются модулями, включая `.d.ts`. Интерфейсы внутри файла остаются локальными — не попадают в глобальную область. Чтобы расширить глобальный Window, нужна обёртка `declare global`.

**`verbatimModuleSyntax: true`** — TypeScript требует чтобы экспорты соответствовали модульной системе. Пустой `export {}` не допускается — нужен `export type {}`.

```
Без moduleDetection: "force":
  global.d.ts → ambient → export type {} и declare global не нужны

С moduleDetection: "force":
  global.d.ts → модуль → нужны оба:
    export type {}    → делает файл валидным модулем
    declare global    → расширяет глобальную область из модуля
```

Итого — все три части обязательны:

```typescript
export type {}; // файл = модуль (для verbatimModuleSyntax)
declare global {
  // выход в глобальную область (для moduleDetection: force)
  interface Window {
    __env__?: EnvConfig; // ? = может не существовать
  }
}
```

### Почему **env**? с вопросительным знаком

`?` означает что `window.__env__` может быть `undefined`:

```
Скрипт env-config.js ещё не загрузился → undefined
Ошибка загрузки скрипта → undefined
Тесты без env-config.js → undefined
```

Поэтому в `env.ts` стоит fallback с дефолтными значениями:

```typescript
const env = window.__env__ ?? {
  API_URL: 'http://localhost:3001',
};
```

`??` и `?` работают в связке как защита.

### Итоговая структура

```
src/
  global.d.ts            ← глобальные типы (Window, EnvConfig)
  shared/
    config/
      env.ts             ← хелпер с дефолтами
public/
  env-config.js          ← переменные окружения
index.html               ← подключение скрипта
```

---

## Шаг 7 — Dockerfile, nginx, entrypoint и кеширование слоёв

### Как работает nginx.conf

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Разбор построчно

- **`server { }`** — Блок виртуального сервера. Nginx может обслуживать несколько сайтов — каждый в своём server блоке.
- **`listen 80`** — Слушать порт 80 (стандартный HTTP).
- **`root /usr/share/nginx/html`** — Корневая папка откуда nginx берёт файлы. Сюда мы копируем собранный dist/ в Dockerfile.
- **`index index.html`** — Если запросили папку (/) — отдать index.html.
- **`location / { }`** — Правило для всех URL начинающихся с / (то есть для всех запросов).
- **`try_files $uri $uri/ /index.html`** — Ключевая строка. Nginx пробует три варианта по очереди:

| Шаг         | Что делает                | Результат           |
| ----------- | ------------------------- | ------------------- |
| $uri        | Ищет файл с таким именем  | Если нашёл — отдаёт |
| $uri/       | Ищет папку с таким именем | Если нашёл — отдаёт |
| /index.html | Отдаёт index.html         | Всегда срабатывает  |

#### Примеры

**Запрос: /dashboard**

```
1. $uri     → ищет файл /usr/share/nginx/html/dashboard     → нет
2. $uri/    → ищет папку /usr/share/nginx/html/dashboard/   → нет
3. /index.html → отдаёт index.html → React Router показывает страницу ✅
```

**Запрос: /assets/style.css**

```
1. $uri → ищет /usr/share/nginx/html/assets/style.css → нашёл, отдаёт ✅
```

Это называется SPA fallback — все маршруты ведут к одному index.html, а клиентский роутер решает что показать.

### Как работает docker-entrypoint.sh

#### Файл docker-entrypoint.sh

```sh
#!/bin/sh

# Переменные окружения с дефолтами
API_URL="${API_URL:-http://localhost:3001}"

# Генерация env-config.js
cat > /usr/share/nginx/html/env-config.js << EOF
window.__env__ = Object.freeze({
  API_URL: '${API_URL}',
});
EOF

exec nginx -g 'daemon off;'
```

#### Как работают плейсхолдеры

`${API_URL}` — это не специальный синтаксис. Shell автоматически подставляет значение переменной окружения.

Цепочка подстановки:

```
docker run -e API_URL=https://api.prod.com my-app
                 ↑
          попадает в ENV контейнера

ENTRYPOINT выполняется при старте:
  shell видит ${API_URL}
  подставляет значение из ENV
  записывает результат в env-config.js
```

#### Дефолтные значения

Синтаксис `${VAR:-default}` — если переменная не передана, берёт default:

```bash
# Переменная передана:
docker run -e API_URL=https://api.prod.com my-app
  → API_URL = "https://api.prod.com"

# Переменная НЕ передана:
docker run my-app
  → API_URL = "http://localhost:3001" (дефолт из :-)
```

#### Результат в файле env-config.js

```javascript
// При docker run -e API_URL=https://api.prod.com
window.__env__ = Object.freeze({
  API_URL: 'https://api.prod.com',
});
```

#### exec nginx

`exec` заменяет текущий процесс (sh) на nginx. Без exec: sh (PID 1) → nginx (PID 2) — лишний процесс. С exec: nginx (PID 1) — корректная обработка сигналов (SIGTERM, SIGQUIT).

`daemon off` — nginx работает на переднем плане. Docker требует это — иначе контейнер завершится сразу после старта.

#### Добавление новой переменной

Одна строка в двух местах:

```sh
# 1. Дефолт в начале файла
NEW_VAR="${NEW_VAR:-default_value}"

# 2. В cat блоке
  NEW_VAR: '${NEW_VAR}',
```

### Кеширование слоёв Docker

Docker выполняет Dockerfile построчно. Каждая команда сохраняется как слой (layer). Если входные данные слоя не изменились — Docker берёт результат из кеша.

**Ключевое правило:** Если слой изменился — все слои после него тоже пересобираются.

```
Слой 1: FROM node:22-alpine            → кешируется
Слой 2: COPY package.json ./           → кешируется пока package.json не менялся
Слой 3: RUN npm ci                     → кешируется пока слой 2 не менялся
Слой 4: COPY . .                       → сбрасывается при любом изменении кода
Слой 5: RUN npm run build              → сбрасывается вместе со слоем 4
```

#### Правильный порядок (наш)

```dockerfile
COPY package.json package-lock.json ./  # меняется редко
RUN npm ci                              # кешируется если package.json не менялся
COPY . .                                # меняется часто (код)
RUN npm run build                       # пересобирается
```

```
Изменил App.tsx → слои 2,3 из кеша → npm ci НЕ запускается → быстро ✅
```

#### Неправильный порядок

```dockerfile
COPY . .                                # меняется при любом изменении
RUN npm ci                              # кеш сброшен, заново
RUN npm run build                       # тоже заново
```

```
Изменил App.tsx → ВСЕ слои сброшены → npm ci заново → медленно ❌
```

#### Разница на практике

| Порядок                            | Время сборки при изменении кода |
| ---------------------------------- | ------------------------------- |
| Правильный (package.json отдельно) | ~15 сек (npm ci из кеша)        |
| Неправильный (всё вместе)          | ~60 сек (npm ci заново)         |

### Dockerfile с комментариями

#### Стейдж 1 — Сборка приложения

```dockerfile
# Базовый образ с Node.js для сборки. alpine — минимальный (~50MB)
# AS builder — имя стейджа, чтобы ссылаться на него ниже
FROM node:22-alpine AS builder

# CI=true — говорит инструментам что мы в CI среде
ENV CI=true

# Рабочая директория внутри контейнера
WORKDIR /app

# Копируем только package.json и lock-файл
# Отдельный слой — если зависимости не менялись, Docker берёт из кеша
COPY package.json package-lock.json ./

# Устанавливаем зависимости
# --ignore-scripts  — пропускает lifecycle скрипты (prepare, postinstall)
# --include=dev     — ставит и devDependencies (нужны для сборки: vite, typescript)
RUN npm ci --ignore-scripts --include=dev

# Копируем весь исходный код
# Идёт после npm ci чтобы изменения в коде не сбрасывали кеш зависимостей
COPY . .

# Собираем приложение — результат в папке dist/
RUN npm run build
```

**Почему `node:22-alpine`:** Vite 8 требует Node `20.19+` или `22.12+`. Поддержка Node 20
закончилась в апреле 2026 — обновлений безопасности больше нет. Версия указана без patch-номера,
чтобы получать исправления. Желательно, чтобы она совпадала с Node на компьютере разработчика.

> _(Раньше: `FROM node:20.19.0-alpine` — ровно минимальная версия для Vite 8, без обновлений
> безопасности; плюс точный patch-номер не давал получать исправления.)_

> _(Раньше: `ENV NODE_OPTIONS="--max_old_space_size=8192" HUSKY=0 CI=true`.
> `NODE_OPTIONS` убрали: это потолок памяти V8 (8 ГБ), а не выделение. Для небольшого проекта
> хватает стандартного, а если у Docker памяти меньше лимита — контейнер убьёт система вместо
> понятной ошибки Node «heap out of memory». Добавлять, когда сборка реально упрётся в память.
> `HUSKY=0` убрали: husky в проекте больше нет.)_

#### Стейдж 2 — Продакшн

```dockerfile
# Чистый nginx без Node.js — образ ~40MB вместо ~300MB
FROM nginx:1.27-alpine

# Заменяем дефолтный конфиг nginx нашим (с try_files для SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранные файлы из стейджа builder в папку nginx
# --from=builder — берём из первого стейджа, Node.js не попадает в финальный образ
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем entrypoint скрипт и даём права на выполнение
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Документация — контейнер слушает порт 80
EXPOSE 80

# Точка входа — скрипт который генерирует env-config.js и запускает nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
```

#### Multi-stage build — зачем два стейджа

|                          | Один стейдж                 | Два стейджа            |
| ------------------------ | --------------------------- | ---------------------- |
| Финальный образ содержит | Node.js + nginx + исходники | Только nginx + статика |
| Размер образа            | ~300MB                      | ~40MB                  |
| Безопасность             | Исходный код доступен       | Только собранные файлы |

Первый стейдж (builder) — собирает. Второй — берёт только dist/ и выбрасывает всё остальное.

### Использование

#### Сборка образа

```bash
docker build -t react-admin .
```

#### Запуск контейнера

```bash
# С дефолтами (API_URL = http://localhost:3001)
docker run -p 3000:80 react-admin

# С переменными окружения
docker run -p 3000:80 -e API_URL=https://api.prod.com react-admin

# Разные окружения — один образ
docker run -p 3000:80 -e API_URL=https://api.dev.com react-admin      # dev
docker run -p 3000:80 -e API_URL=https://api.staging.com react-admin  # staging
docker run -p 3000:80 -e API_URL=https://api.prod.com react-admin     # prod
```

#### .dockerignore

Исключает ненужные файлы из контекста сборки — ускоряет копирование и уменьшает размер:

```
node_modules
dist
.git
.idea
.DS_Store
```

> _(Раньше: вместо `.DS_Store` была `.husky` — husky в проекте больше нет. `.DS_Store` — служебный
> файл macOS.)_

### Итоговая структура файлов

```
react/
  docker-entrypoint.sh  ← генерирует env-config.js при старте
  nginx.conf            ← конфиг nginx с SPA fallback
  Dockerfile            ← multi-stage сборка
  .dockerignore         ← исключения для Docker
```

---

## Где добавлять/изменять переменные окружения

При добавлении новой переменной нужно внести изменения в **4 файла**:

| #   | Файл                       | Что добавить                      |
| --- | -------------------------- | --------------------------------- |
| 1   | `public/env-config.js`     | Значение для локальной разработки |
| 2   | `src/global.d.ts`          | Тип в интерфейсе `EnvConfig`      |
| 3   | `src/shared/config/env.ts` | Экспорт + дефолтное значение      |
| 4   | `docker-entrypoint.sh`     | Дефолт + строку в cat блоке       |

### Пример: добавляем `APP_ENV`

**1. `public/env-config.js`:**

```javascript
window.__env__ = Object.freeze({
  API_URL: 'http://localhost:3001',
  APP_ENV: 'development', // ← добавить
});
```

**2. `src/global.d.ts`:**

```typescript
export type {};

declare global {
  interface EnvConfig {
    API_URL: string;
    APP_ENV: string; // ← добавить
  }

  interface Window {
    __env__?: EnvConfig;
  }
}
```

**3. `src/shared/config/env.ts`:**

```typescript
const env = window.__env__ ?? {
  API_URL: 'http://localhost:3001',
  APP_ENV: 'development', // ← добавить
};

export const API_URL = env.API_URL;
export const APP_ENV = env.APP_ENV; // ← добавить
```

**4. `docker-entrypoint.sh`:**

```sh
#!/bin/sh

API_URL="${API_URL:-http://localhost:3001}"
APP_ENV="${APP_ENV:-development}"        # ← добавить

cat > /usr/share/nginx/html/env-config.js << EOF
window.__env__ = Object.freeze({
  API_URL: '${API_URL}',
  APP_ENV: '${APP_ENV}',               // ← добавить
});
EOF

exec nginx -g 'daemon off;'
```

### Использование в коде

```typescript
import { API_URL, APP_ENV } from '@/shared/config/env';

const response = await fetch(`${API_URL}/users`);
console.log(`Environment: ${APP_ENV}`);
```
