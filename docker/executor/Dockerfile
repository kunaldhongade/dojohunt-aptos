# Dockerfile for Node.js code execution sandbox
# This creates a minimal, secure environment for executing user code
FROM node:20-alpine

# Install security updates and necessary tools
RUN apk update && apk upgrade && \
    apk add --no-cache python3 make g++ && \
    rm -rf /var/cache/apk/*

# Create directories with proper permissions
RUN mkdir -p /app/code /app/output && \
    chown -R node:node /app

# Set working directory
WORKDIR /app

# Copy execution runner script
COPY executor-runner.js /app/executor-runner.js
RUN chown node:node /app/executor-runner.js && \
    chmod +x /app/executor-runner.js

# Switch to non-root node user
USER node

# Set memory limit for Node.js (128MB heap)
ENV NODE_OPTIONS="--max-old-space-size=128"

# Default command
CMD ["node", "/app/executor-runner.js"]


