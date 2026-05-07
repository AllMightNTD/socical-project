# ======================
# Stage 1: Base (deps)
# ======================
FROM node:20-alpine AS base
WORKDIR /app

# chỉ copy file dependency để cache đúng
COPY package.json package-lock.json ./
RUN npm ci

# ======================
# Stage 2: Development
# ======================
FROM node:20-alpine AS development
WORKDIR /app
ENV NODE_ENV=development

# copy deps + source
COPY --from=base /app/node_modules ./node_modules
COPY . .

# 👉 FIX quyền cho user node (UID=1000, GID=1000)
RUN chown -R node:node /app

# 👉 chạy app bằng user node
USER node

CMD ["npm", "run", "start:dev"]

# ======================
# Stage 3: Build
# ======================
FROM node:20-alpine AS build
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ======================
# Stage 4: Production
# ======================
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# 👉 FIX quyền + dùng user node
RUN chown -R node:node /app
USER node

EXPOSE 3000
CMD ["node", "dist/main.js"]
