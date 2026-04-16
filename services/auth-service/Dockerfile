# 1. Use a lightweight Node.js image
FROM node:20-alpine AS builder

# 2. Set working directory
WORKDIR /app

# 3. Copy package files first (to use Docker cache for dependencies)
COPY package*.json ./

# 4. Install dependencies (Clean Install for production)
RUN npm ci --only=production

# 5. Copy the rest of the application code
COPY . .

# 6. Final Stage - Use a clean image to keep it small
FROM node:20-alpine

WORKDIR /app

# 7. Copy ONLY the necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src

# 8. Security: Don't run as root user
# node-alpine image comes with a 'node' user by default
USER node

# 9. Expose the port the app runs on
EXPOSE 3000

# 10. Start the application
CMD ["node", "src/server.js"]