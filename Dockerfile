# ─── Stage 1: deps ───────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts --legacy-peer-deps

# ─── Stage 2: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client and build the app
RUN npx prisma generate
RUN npm run build

# Prune development dependencies to keep the production footprint small
RUN npm prune --production --legacy-peer-deps

# ─── Stage 3: production runner ──────────────────────────────────────────────
FROM node:20-alpine AS runner
# Install libc6-compat and openssl so the Prisma binary can execute migrations
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOME=/tmp

# Create a non-root system user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs -G nodejs

# Set up correct permissions before switching users
RUN chown -R nextjs:nodejs /app

# Safely copy runtime artifacts with correct ownership attributes
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

USER nextjs

EXPOSE 4000

# Apply pending migrations then start the server.
#
# NOTE FOR PRODUCTION SCALING: Running migrate deploy on every container
# start is safe for a single-instance deployment but adds ~2-5 s of startup
# latency and creates a race condition when scaling to multiple instances
# (two containers may attempt concurrent migrations on the same schema).
# For multi-instance deployments, move the migration to a Render "Pre-Deploy
# Command" (Dashboard → Service → Settings → Deploy Command) and change this
# CMD to just: CMD ["npm", "start"]
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
