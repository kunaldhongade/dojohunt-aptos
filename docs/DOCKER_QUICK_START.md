# Docker Sandbox Quick Start Guide

Quick setup guide for Docker-based code execution in DojoHunt.

## Quick Setup (5 minutes)

### 1. Install Docker

**Linux:**

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and log back in
```

**macOS:**

```bash
brew install --cask docker
# Or download from https://www.docker.com/products/docker-desktop
```

**Windows:**
Download Docker Desktop from https://www.docker.com/products/docker-desktop

### 2. Build Executor Image

```bash
npm run docker:build-executor
```

### 3. Verify Installation

```bash
npm run docker:test-executor
```

You should see Node.js version output.

### 4. Enable Docker Executor

Add to `.env.local`:

```env
USE_DOCKER_EXECUTOR=true
```

### 5. Start Your Application

```bash
npm run dev
```

That's it! Your application will now use Docker for code execution.

## Testing

Test with a simple code submission in your application:

- Go to any challenge
- Write and run code
- Check that it executes in a Docker container

## Troubleshooting

### Docker not found

```bash
# Check Docker is running
docker info

# If not, start Docker service
sudo systemctl start docker  # Linux
# Or start Docker Desktop on macOS/Windows
```

### Permission denied

```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
# Log out and log back in
```

### Image not found

```bash
# Rebuild the image
npm run docker:build-executor
```

## What's Next?

- Read [DOCKER_SANDBOX_SETUP.md](./DOCKER_SANDBOX_SETUP.md) for detailed documentation
- Customize resource limits in `lib/docker-executor.ts`
- Monitor execution logs for performance

## Disable Docker (Fallback Mode)

To disable Docker and use direct execution:

```env
USE_DOCKER_EXECUTOR=false
```

**Note**: Direct execution is less secure and should only be used for development.
