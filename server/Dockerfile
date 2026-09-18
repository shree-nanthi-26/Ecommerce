# ──────────────────────────────────────────────────────────────────────────────
# Production Dockerfile for Furniva Backend API
# Multi-stage build for minimal image size and maximum security
# ──────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=production

# Production runner
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=5000

# Run as non-root user for security
USER node

COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node . .

EXPOSE 5000

# Healthcheck to verify container health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
