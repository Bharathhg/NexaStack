# Multi-stage Dockerfile for Service 1 Backend
# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

# Stage 2: Production image
FROM node:18-alpine AS runner
WORKDIR /app

# Security: run as non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir -p /app/data && chown -R appuser:appgroup /app
USER appuser

COPY --from=deps /app/node_modules ./node_modules
COPY server.js database.js ./

ENV PORT=4001
ENV NODE_ENV=production

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4001/health || exit 1

CMD ["node", "server.js"]
