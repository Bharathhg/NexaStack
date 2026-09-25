# Multi-stage Dockerfile for Service 2 Backend
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

FROM node:18-alpine AS runner
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir -p /app/data && chown -R appuser:appgroup /app
USER appuser

COPY --from=deps /app/node_modules ./node_modules
COPY server.js database.js ./

ENV PORT=4002
ENV NODE_ENV=production

EXPOSE 4002

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4002/health || exit 1

CMD ["node", "server.js"]
