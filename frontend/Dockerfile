# syntax=docker/dockerfile:1

# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies first (separate layer — only rebuilds when package files change).
# The BuildKit cache mount keeps npm's download cache (~/.npm) persistent ACROSS builds,
# so even when this layer re-runs, packages are restored from the local cache instead of
# being re-downloaded from the registry — much faster and far less internet usage.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy source (excludes node_modules/, build/, .env — see .dockerignore)
COPY . .

# Receive the publishable key as a build argument (passed from docker-compose.yml).
# This is a public-facing key (safe to embed in the JS bundle) but should not be
# hardcoded in the Dockerfile itself.
ARG REACT_APP_STRIPE_PUBLISHABLE_KEY
ENV REACT_APP_STRIPE_PUBLISHABLE_KEY=$REACT_APP_STRIPE_PUBLISHABLE_KEY

# Treat warnings as warnings, not errors
ENV CI=false

RUN npm run build

# Production stage — serve compiled assets with Nginx
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
