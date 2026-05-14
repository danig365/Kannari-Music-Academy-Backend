# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies first (separate layer — only rebuilds when package files change)
COPY package.json package-lock.json ./
RUN npm ci

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
