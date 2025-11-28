import { exec } from "child_process";
import { mkdir, unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface ExecutionOptions {
  timeout?: number; // in milliseconds
  memoryLimit?: number; // in MB
  cpuLimit?: number; // CPU percentage (0.5 = 50%)
}

export interface DockerExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
  memoryUsed?: number;
  exitCode?: number;
}

export class DockerExecutor {
  private static readonly CONTAINER_NAME_PREFIX = "dojohunt-executor";
  private static readonly DOCKER_IMAGE = "dojohunt-node-executor:latest";
  private static readonly DEFAULT_TIMEOUT = 5000; // 5 seconds
  private static readonly DEFAULT_MEMORY_LIMIT = 128; // 128 MB
  private static readonly DEFAULT_CPU_LIMIT = 0.5; // 50% CPU

  /**
   * Build the Docker image if it doesn't exist
   */
  static async ensureImageExists(): Promise<void> {
    try {
      // Check if image exists
      const { stdout } = await execAsync(
        `docker images -q ${this.DOCKER_IMAGE}`
      );
      if (!stdout.trim()) {
        console.log("Building Docker executor image...");
        const dockerfilePath = join(process.cwd(), "docker", "executor");
        await execAsync(
          `docker build -t ${this.DOCKER_IMAGE} ${dockerfilePath}`
        );
        console.log("Docker executor image built successfully");
      }
    } catch (error) {
      console.error("Failed to build Docker image:", error);
      throw new Error(
        "Docker executor image not found. Please build it using: docker build -t dojohunt-node-executor:latest docker/executor"
      );
    }
  }

  /**
   * Execute JavaScript code in a Docker container
   */
  static async executeCode(
    code: string,
    input: string = "",
    options: ExecutionOptions = {}
  ): Promise<DockerExecutionResult> {
    const startTime = Date.now();
    const containerName = `${
      this.CONTAINER_NAME_PREFIX
    }-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const timeout = options.timeout || this.DEFAULT_TIMEOUT;
    const memoryLimit = options.memoryLimit || this.DEFAULT_MEMORY_LIMIT;
    const cpuLimit = options.cpuLimit || this.DEFAULT_CPU_LIMIT;

    // Create temporary directory for code and input
    const tempDir = join(tmpdir(), `dojohunt-${Date.now()}`);
    const codePath = join(tempDir, "solution.js");
    const inputPath = join(tempDir, "input.txt");

    try {
      // Ensure Docker image exists
      await this.ensureImageExists();

      // Create temp directory
      await mkdir(tempDir, { recursive: true });

      // Write code and input to files
      await writeFile(codePath, code, "utf8");
      await writeFile(inputPath, input, "utf8");

      // Docker run command with resource limits
      // Note: Using --stop-timeout for graceful shutdown
      const timeoutSeconds = Math.ceil(timeout / 1000);
      const dockerCmd = [
        "docker run",
        `--name ${containerName}`,
        `--rm`, // Remove container after execution
        `--memory=${memoryLimit}m`, // Memory limit
        `--cpus="${cpuLimit}"`, // CPU limit
        `--network none`, // No network access
        `--read-only`, // Read-only filesystem
        `--tmpfs /tmp:rw,noexec,nosuid,size=10m`, // Temporary filesystem
        `--tmpfs /app/code:rw,noexec,nosuid,size=10m`, // Code directory
        `--stop-timeout ${timeoutSeconds}`, // Stop timeout
        `--workdir /app/code`,
        `-v ${codePath}:/app/code/solution.js:ro`, // Mount code as read-only
        `-v ${inputPath}:/app/code/input.txt:ro`, // Mount input as read-only
        `${this.DOCKER_IMAGE}`,
        "node",
        "/app/executor-runner.js",
        "/app/code/solution.js",
        "/app/code/input.txt",
      ].join(" ");

      // Execute in container with timeout
      let output = "";
      let error = "";
      let exitCode = 0;

      try {
        // Use Promise.race to implement timeout
        const executionPromise = execAsync(dockerCmd, {
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("TIMEOUT"));
          }, timeout + 2000); // Add 2 second buffer for Docker overhead
        });

        const result = (await Promise.race([
          executionPromise,
          timeoutPromise,
        ])) as any;
        output = result.stdout || "";
        error = result.stderr || "";
      } catch (execError: any) {
        // Handle execution errors
        if (execError.message === "TIMEOUT") {
          // Kill the container on timeout
          try {
            await execAsync(`docker kill ${containerName}`).catch(() => {});
          } catch {
            // Ignore kill errors
          }
          error = "Execution timeout: Code execution exceeded time limit";
          exitCode = 124; // Timeout exit code
        } else if (
          execError.code === "ETIMEDOUT" ||
          execError.signal === "SIGTERM"
        ) {
          error = "Execution timeout: Code execution exceeded time limit";
          exitCode = 124;
        } else if (execError.stderr) {
          error = execError.stderr;
          exitCode = execError.code || 1;
        } else if (execError.stdout) {
          // Sometimes errors are in stdout
          output = execError.stdout;
          error = execError.message || "Execution failed";
          exitCode = execError.code || 1;
        } else {
          error = execError.message || "Execution failed";
          exitCode = execError.code || 1;
        }
      }

      // Clean up container if it still exists (shouldn't happen with --rm)
      try {
        await execAsync(`docker rm -f ${containerName}`).catch(() => {
          // Ignore errors, container might already be removed
        });
      } catch {
        // Ignore cleanup errors
      }

      // Clean up temporary files
      await this.cleanup(tempDir);

      const executionTime = Date.now() - startTime;

      return {
        success: exitCode === 0 && !error,
        output: output.trim(),
        error: error ? error.trim() : undefined,
        executionTime,
        exitCode,
      };
    } catch (error) {
      // Clean up on error
      await this.cleanup(tempDir);

      // Try to remove container
      try {
        await execAsync(`docker rm -f ${containerName}`).catch(() => {});
      } catch {
        // Ignore cleanup errors
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Execution failed",
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Clean up temporary files
   */
  private static async cleanup(tempDir: string): Promise<void> {
    try {
      const fs = await import("fs/promises");
      const { existsSync } = await import("fs");

      try {
        const codePath = join(tempDir, "solution.js");
        const inputPath = join(tempDir, "input.txt");

        // Delete files
        if (existsSync(codePath)) {
          await fs.unlink(codePath).catch(() => {});
        }
        if (existsSync(inputPath)) {
          await fs.unlink(inputPath).catch(() => {});
        }

        // Delete directory (Node.js 14.14+ supports recursive rm)
        if (existsSync(tempDir)) {
          try {
            // Try using rm with recursive option (Node 14.14+)
            await (fs as any).rm(tempDir, { recursive: true, force: true });
          } catch {
            // Fallback: try rmdir (may fail if directory not empty, which is fine)
            try {
              await fs.rmdir(tempDir);
            } catch {
              // Ignore - directory cleanup is best effort
            }
          }
        }
      } catch {
        // Ignore cleanup errors - temp files will be cleaned up by OS
      }
    } catch {
      // Ignore if fs/promises import fails
    }
  }

  /**
   * Check if Docker is available and running
   */
  static async checkDockerAvailable(): Promise<boolean> {
    try {
      await execAsync("docker --version");
      await execAsync("docker info");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get container resource usage (if available)
   */
  static async getContainerStats(containerName: string): Promise<{
    memoryUsed?: number;
    cpuUsed?: number;
  }> {
    try {
      const { stdout } = await execAsync(
        `docker stats --no-stream --format "{{.MemUsage}},{{.CPUPerc}}" ${containerName}`
      );
      const [memUsage, cpuPerc] = stdout.trim().split(",");

      // Parse memory (e.g., "50MiB / 128MiB")
      const memoryMatch = memUsage.match(/(\d+\.?\d*)\s*MiB/);
      const memoryUsed = memoryMatch ? parseFloat(memoryMatch[1]) : undefined;

      // Parse CPU percentage (e.g., "25.50%")
      const cpuMatch = cpuPerc.match(/(\d+\.?\d*)%/);
      const cpuUsed = cpuMatch ? parseFloat(cpuMatch[1]) : undefined;

      return { memoryUsed, cpuUsed };
    } catch {
      return {};
    }
  }
}
