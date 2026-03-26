FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Run the SSR Node server
FROM node:20-alpine
WORKDIR /app
# Copy the compiled dist folder from the build stage
COPY --from=build /app/dist ./dist

# Set the exact environment variables from your bash script
ENV HOST=0.0.0.0
ENV PORT=4200

ENV NODE_OPTIONS="--max-old-space-size=4096"

EXPOSE 4200

# Start the Angular SSR server
# Force the memory limit directly in the execution command
ENTRYPOINT ["node", "--max-old-space-size=4096", "dist/grocery-frontend/server/server.mjs"]