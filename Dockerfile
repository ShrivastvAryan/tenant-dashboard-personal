# Use a Debian-based Node.js image to avoid build issues
FROM node:24-bullseye AS builder

# Install dependencies required for native modules and bun
RUN apt-get update && apt-get install -y curl python3 python3-pip build-essential

# Install Bun globally
RUN curl -fsSL https://bun.sh/install | bash

# Add bun to PATH
ENV PATH="/root/.bun/bin:$PATH"

# Set the working directory
WORKDIR /app

# Copy the Bun manifest and lockfile before source code for reproducible builds.
COPY package.json bun.lock ./

# Install dependencies using Bun
RUN bun install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Build the Next.js app using Bun
RUN bun run build

# Use a lightweight Node.js image for production
FROM node:24-bullseye-slim AS runner
RUN apt-get update && apt-get install -y \
  ca-certificates \
  openssl \
  libstdc++6 \
 && rm -rf /var/lib/apt/lists/*
 
# Set the working directory
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000


# Copy built files from the builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose the Next.js default port
EXPOSE 3000

# Start the app using Bun
CMD ["node", "server.js"]
