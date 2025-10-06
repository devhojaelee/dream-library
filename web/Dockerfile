# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Build arguments for dynamic UID/GID (defaults for local development)
ARG CONTAINER_UID=1001
ARG CONTAINER_GID=1001

# Install su-exec for user switching
RUN apk add --no-cache su-exec

# Create non-root user with dynamic UID/GID
RUN addgroup --system --gid ${CONTAINER_GID} nodejs && \
    adduser --system --uid ${CONTAINER_UID} nextjs

# Copy built files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy data directory with initial files
COPY --from=builder /app/data ./data

# Set correct permissions for data directory
RUN chown -R nextjs:nodejs /app/data

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
