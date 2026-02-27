# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Optional frontend build-time env vars can be passed externally if needed.
ENV REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51Sh85EG1PnxKY4Lec23vbHBIy95m3DU3hgOrrWCXmrzBKyoWcovHXx4DNBUpTFrXXKlWfXzrBcUIEEeJYQT49pds007yEvTFJD
ENV CI=false

# Build the app
RUN npm run build

# Production stage - serve with Nginx
FROM nginx:alpine

# Copy built files
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx config for React SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
