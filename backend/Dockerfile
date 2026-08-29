# Sportscast API — multi-stage so npm's cache and metadata never reach the runtime image.
# syntax=docker/dockerfile:1

# ---- deps stage ---------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# There are no devDependencies in this package, so --omit=dev is belt-and-braces:
# it guarantees the image cannot grow one silently later.
RUN npm ci --omit=dev && npm cache clean --force

# ---- runtime stage ------------------------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# dumb-init reaps zombies and forwards SIGTERM, so the graceful shutdown in
# server.js actually runs instead of the container being SIGKILLed after 10s.
RUN apk add --no-cache dumb-init

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node server.js ./
COPY --chown=node:node src ./src

USER node
EXPOSE 4000

# /api/health returns 200 even when MongoDB is down. That is deliberate: the API
# serves matches and news without the database, so a DB blip must NOT restart-loop
# this container. The check proves the event loop is alive and routing works.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:4000/api/health >/dev/null || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
