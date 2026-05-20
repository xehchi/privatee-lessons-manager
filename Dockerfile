# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# Install deps (cached layer)
COPY package.json bun.lockb* package-lock.json* ./
RUN npm install --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine AS runtime
WORKDIR /app

# Tiny static server, installed offline-friendly
RUN npm install -g serve@14

# Copy built assets only
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
