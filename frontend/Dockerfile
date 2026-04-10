# Stage 1: Build Frontend and Data
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (from the context of /app in the container)
COPY frontend/package.json frontend/package-lock.json* ./frontend/
RUN cd frontend && npm install

# Copy all source files
COPY . .

# Compile markdown/yaml data to JSON and build React app
WORKDIR /app/frontend
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built artifacts from builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
