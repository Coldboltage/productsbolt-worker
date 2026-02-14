FROM node:20-alpine

WORKDIR /usr/src/app

# Chromium + Xvfb + required libs/fonts
RUN apk add --no-cache \
  chromium \
  xvfb \
  nss \
  freetype \
  harfbuzz \
  ttf-freefont \
  ca-certificates

ENV CHROME_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

# Run app under Xvfb
CMD ["sh", "-c", "xvfb-run -a node dist/main.js"]