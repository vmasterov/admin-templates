#!/bin/sh

# =============================================================================
# Entrypoint скрипт — выполняется при каждом запуске контейнера
# Генерирует env-config.js из переменных окружения
# =============================================================================

# Переменные окружения с дефолтами
# ${VAR:-default} — если VAR не передан через docker run -e, берёт default
API_URL="${API_URL:-http://localhost:3001}"

# Генерация env-config.js
# cat > файл << EOF ... EOF — записывает текст между EOF в файл
# Перезаписывает захардкоженный env-config.js из public/
# Shell автоматически подставляет ${API_URL} из переменных выше
cat > /usr/share/nginx/html/env-config.js << EOF
window.__env__ = Object.freeze({
  API_URL: '${API_URL}',
});
EOF

# exec заменяет текущий процесс (sh) на nginx
# Без exec: sh (PID 1) → nginx (PID 2) — лишний процесс
# С exec:   nginx (PID 1) — корректная обработка сигналов (SIGTERM, SIGQUIT)
# daemon off — nginx работает на переднем плане (Docker требует это)
exec nginx -g 'daemon off;'