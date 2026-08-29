# Sportscast web — builds the SPA, serves it from nginx as an unprivileged user.
# syntax=docker/dockerfile:1

# ---- build stage --------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# "/" makes the app call the API on the same origin (/api), which nginx proxies
# to the API container. Vite inlines this at BUILD time, so it must be set here
# and not at runtime. It is a path, never a secret.
ARG VITE_API_URL=/
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- runtime stage ------------------------------------------------------
# No node, no npm, no build tooling: just nginx and 2.9 MB of static assets.
FROM nginx:1.27-alpine AS runtime

# Run the master process as `nginx` too, not just the workers. That needs the
# pid file and every temp path to live somewhere the nginx user can write.
# The base image uses `pid /run/nginx.pid` (NOT /var/run) and /run is root-owned,
# so the master fails with EACCES before it ever binds. Move the pid file to /tmp,
# drop the `user` directive (meaningless once we are not root, and it warns), and
# hand nginx the temp dirs it writes to.
RUN sed -i 's,^pid  *.*,pid /tmp/nginx.pid;,' /etc/nginx/nginx.conf \
 && sed -i '/^user  *nginx;/d' /etc/nginx/nginx.conf \
 && chown -R nginx:nginx /var/cache/nginx /etc/nginx/conf.d

COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

USER nginx
# 8080, not 80: ports below 1024 need root. Traefik targets this port.
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
