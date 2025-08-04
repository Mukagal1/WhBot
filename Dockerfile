FROM node:18-slim

# Устанавливаем зависимости для Chromium
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libu2f-udev \
    libvulkan1 \
    xdg-utils \
    chromium \
    --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию и копируем проект
WORKDIR /app
COPY . .

# Устанавливаем зависимости проекта
RUN npm install

# Указываем путь к Chromium
ENV CHROME_PATH=/usr/bin/chromium

# Стартовое выполнение
CMD ["node", "index.js"]
