# Debian-based = least pain for Chromium + Xvfb
FROM node:20-bookworm-slim

WORKDIR /usr/src/app

# Chromium + Xvfb + xvfb-run deps + common Chrome runtime libs/fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    xvfb \
    xauth \
    fonts-liberation \
    ca-certificates \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libgbm1 \
    libdrm2 \
    libxrandr2 \
    libxkbcommon0 \
  && rm -rf /var/lib/apt/lists/*

# Tell chrome-launcher / puppeteer-real-browser where Chromium is
ENV CHROME_PATH=/usr/bin/chromium
# Avoid puppeteer trying to download its own chrome during npm install
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

# Run your Nest app with a virtual X display
CMD ["sh", "-c", "xvfb-run -a -s '-screen 0 1920x1080x24' node dist/main.js"]