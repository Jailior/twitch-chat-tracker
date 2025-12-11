FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f pnpm-lock.yaml ]; then \
      npm install -g pnpm && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then \
      yarn install --frozen-lockfile; \
    else \
      npm install --omit=dev=false; \
    fi
COPY tsconfig.json ./tsconfig.json
COPY src ./src
RUN npm run build || (if [ -f pnpm-lock.yaml ]; then pnpm run build; elif [ -f yarn.lock ]; then yarn build; fi)

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f pnpm-lock.yaml ]; then \
      npm install -g pnpm && pnpm install --prod --frozen-lockfile; \
    elif [ -f yarn.lock ]; then \
      yarn install --production --frozen-lockfile; \
    else \
      npm install --omit=dev; \
    fi
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]

