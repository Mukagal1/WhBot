FROM node:18-slim

# Устанавливаем Chromium и зависимости
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation libappindicator3-1 libasound2 \
    libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 \
    libgdk-pixbuf2.0-0 libnspr4 libnss3 libxcomposite1 \
    libxdamage1 libxrandr2 xdg-utils libu2f-udev libvulkan1 \
    --no-install-recommends && apt-get clean

# Устанавливаем зависимости проекта
WORKDIR /app
COPY . .
RUN npm install

# Задаём переменную окружения для WPPConnect
ENV CHROME_PATH=/usr/bin/chromium

# Запускаем бота
CMD ["node", "index.js"]
