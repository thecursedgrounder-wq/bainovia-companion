# Build stage
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# Runtime stage
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY . .
# Create writable data dir for SQLite
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["node", "src/server.js"]
