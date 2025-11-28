# Docker Sandbox Setup for Code Execution

This document explains how to set up and use the Docker-based sandboxed code execution system, similar to LeetCode's execution environment.

## Overview

The DojoHunt platform now supports sandboxed code execution using Docker containers. This provides:

- **Security**: Isolated execution environment with no network access
- **Resource Limits**: CPU and memory limits per execution
- **Timeout Protection**: Automatic timeout handling
- **Clean Execution**: Each execution runs in a fresh container

## Architecture

The Docker execution system consists of:

1. **Docker Image**: `dojohunt-node-executor:latest`

   - Based on Node.js 20 Alpine
   - Minimal, secure environment
   - Non-root user execution
   - Read-only filesystem

2. **Executor Runner**: `docker/executor/executor-runner.js`

   - Handles code execution within the container
   - Manages input/output
   - Implements timeout protection

3. **Docker Executor**: `lib/docker-executor.ts`

   - TypeScript class for executing code in Docker
   - Resource limit management
   - Container lifecycle management

4. **Code Executor**: `lib/code-executor.ts`
   - High-level interface for code execution
   - Automatic fallback to direct execution if Docker is unavailable
   - Supports both Docker and direct execution modes

## Prerequisites

1. **Docker**: Install Docker Engine (version 20.10 or later)

   ```bash
   # Check Docker installation
   docker --version
   docker info
   ```

2. **Docker Compose** (optional, for easier setup)
   ```bash
   docker-compose --version
   ```

## Setup Instructions

### 1. Build the Docker Executor Image

```bash
# Using npm script
npm run docker:build-executor

# Or directly with Docker
docker build -t dojohunt-node-executor:latest docker/executor
```

### 2. Verify the Image

```bash
# Using npm script
npm run docker:test-executor

# Or directly
docker run --rm dojohunt-node-executor:latest node --version
```

### 3. Configure Environment

Add to your `.env.local` file:

```env
# Enable Docker executor (set to "false" to disable)
USE_DOCKER_EXECUTOR=true
```

If `USE_DOCKER_EXECUTOR` is not set, the system will automatically detect if Docker is available and use it if possible.

### 4. Start Services (Optional)

If using docker-compose for MongoDB:

```bash
npm run docker:up
```

## How It Works

### Execution Flow

1. **Code Submission**: User submits JavaScript code
2. **Validation**: Code is validated for security (blacklist patterns)
3. **Container Creation**: Docker container is created with:
   - Code file mounted as read-only
   - Input file mounted as read-only
   - Resource limits (CPU, memory)
   - Network disabled
   - Read-only filesystem
4. **Execution**: Code runs in the container using Node.js V8 engine
5. **Output Capture**: stdout/stderr are captured
6. **Cleanup**: Container is automatically removed after execution

### Resource Limits

Default limits per execution:

- **Memory**: 128 MB
- **CPU**: 50% (0.5 cores)
- **Timeout**: 5 seconds (configurable)

These can be customized in `lib/docker-executor.ts`:

```typescript
const options = {
  timeout: 5000, // 5 seconds
  memoryLimit: 128, // 128 MB
  cpuLimit: 0.5, // 50% CPU
};
```

### Security Features

1. **Network Isolation**: Containers run with `--network none`
2. **Read-only Filesystem**: Base filesystem is read-only
3. **Temporary Filesystems**: Only `/tmp` and `/app/code` are writable
4. **Non-root User**: Code executes as non-root user (`executor`)
5. **Resource Limits**: CPU and memory limits prevent resource exhaustion
6. **Timeout Protection**: Automatic timeout kills long-running processes

## Usage

### Automatic Mode (Recommended)

The system automatically uses Docker if available:

```typescript
import { CodeExecutor } from "@/lib/code-executor";

const result = await CodeExecutor.executeJavaScript(code, testCases);
```

### Manual Docker Execution

```typescript
import { DockerExecutor } from "@/lib/docker-executor";

const result = await DockerExecutor.executeCode(code, input, {
  timeout: 5000,
  memoryLimit: 128,
  cpuLimit: 0.5,
});
```

### Direct Execution (Fallback)

If Docker is not available, the system automatically falls back to direct Node.js execution (less secure, but functional for development).

## Testing

### Test Docker Executor

```bash
# Test with a simple script
echo 'console.log("Hello, Docker!");' > test.js
docker run --rm -v $(pwd)/test.js:/app/code/solution.js:ro dojohunt-node-executor:latest node /app/executor-runner.js /app/code/solution.js
```

### Test from Application

1. Start your Next.js application
2. Submit code through the web interface
3. Check logs for Docker execution messages

## Troubleshooting

### Docker Not Found

**Error**: `Docker executor image not found`

**Solution**: Build the Docker image:

```bash
npm run docker:build-executor
```

### Permission Denied

**Error**: `permission denied while trying to connect to the Docker daemon socket`

**Solution**: Add your user to the docker group:

```bash
sudo usermod -aG docker $USER
# Log out and log back in
```

### Container Timeout

**Error**: `Execution timeout: Code execution exceeded time limit`

**Solution**: This is expected behavior for code that runs too long. Check:

1. Code doesn't have infinite loops
2. Timeout is appropriate for your use case
3. Code is optimized

### Memory Limit Exceeded

**Error**: Container killed due to memory limit

**Solution**: Increase memory limit in `lib/docker-executor.ts` or optimize code.

### Image Build Fails

**Error**: Docker build fails

**Solution**:

1. Check Docker is running: `docker info`
2. Check Dockerfile syntax
3. Check network connectivity (for pulling base images)

## Performance Considerations

### Container Overhead

- Container creation: ~100-500ms
- Container cleanup: ~50-200ms
- Total overhead: ~150-700ms per execution

### Optimization Tips

1. **Reuse Images**: Keep the executor image built and available
2. **Parallel Execution**: Multiple containers can run simultaneously
3. **Resource Limits**: Tune limits based on your server capacity
4. **Caching**: Consider caching for frequently executed code patterns

## Comparison: Docker vs Direct Execution

| Feature              | Docker Execution | Direct Execution   |
| -------------------- | ---------------- | ------------------ |
| Security             | High (isolated)  | Low (same process) |
| Resource Limits      | Yes              | Limited            |
| Network Access       | None             | Full               |
| Filesystem Access    | Read-only        | Full               |
| Setup Complexity     | Medium           | Low                |
| Performance Overhead | ~150-700ms       | None               |
| Recommended For      | Production       | Development        |

## Production Deployment

### Requirements

1. Docker Engine installed on server
2. Docker executor image built
3. Sufficient resources (CPU, memory) for concurrent executions
4. Docker daemon running

### Recommended Configuration

```env
USE_DOCKER_EXECUTOR=true
```

### Monitoring

Monitor:

- Container creation/removal rates
- Resource usage (CPU, memory)
- Execution times
- Timeout rates
- Error rates

### Scaling

For high-traffic scenarios:

- Consider container orchestration (Kubernetes, Docker Swarm)
- Implement container pooling/reuse
- Use container runtime alternatives (containerd, Podman)
- Consider serverless code execution (AWS Lambda, Google Cloud Functions)

## Advanced Configuration

### Custom Resource Limits

Edit `lib/docker-executor.ts`:

```typescript
const options = {
  timeout: 10000, // 10 seconds
  memoryLimit: 256, // 256 MB
  cpuLimit: 1.0, // 100% CPU (1 core)
};
```

### Custom Docker Image

Modify `docker/executor/Dockerfile` to add additional tools or libraries.

### Network Access (Not Recommended)

To allow network access (for testing only), modify `lib/docker-executor.ts`:

```typescript
// Remove: `--network none`,
```

**Warning**: This significantly reduces security!

## Security Best Practices

1. **Always use Docker in production**: Never use direct execution in production
2. **Keep images updated**: Regularly update base images for security patches
3. **Monitor resource usage**: Set appropriate limits
4. **Log executions**: Log all code executions for auditing
5. **Rate limiting**: Implement rate limiting to prevent abuse
6. **Code validation**: Always validate code before execution
7. **Regular security audits**: Audit Docker images and execution logs

## References

- [Docker Documentation](https://docs.docker.com/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Docker Security](https://docs.docker.com/engine/security/)

## Support

For issues or questions:

1. Check this documentation
2. Review error logs
3. Check Docker logs: `docker logs <container-name>`
4. Verify Docker installation and permissions
