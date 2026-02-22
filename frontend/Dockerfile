FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

FROM base AS dependencies
COPY package.json package-lock.json* ./
RUN npm install

FROM base AS build
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
RUN npm run build

FROM base AS deploy
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]