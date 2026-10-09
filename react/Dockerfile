# =============================================================================
# Стейдж 1 — Сборка приложения
# =============================================================================

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

# =============================================================================
# Стейдж 2 — Продакшн (только nginx + статика)
# =============================================================================

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