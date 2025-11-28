import { spawn } from "child_process";
import { unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { DockerExecutor } from "./docker-executor";

export interface TestCase {
  input?: string;
  output: string;
  explanation?: string;
  variables?: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
  memoryUsed?: number;
  testResults?: TestResult[];
}

export interface TestResult {
  testCase: number;
  status: "passed" | "failed" | "error";
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  executionTime?: number;
  error?: string;
}

export class CodeExecutor {
  private static readonly TIMEOUT = 10000; // 10 seconds
  private static readonly MEMORY_LIMIT = 512; // 512 MB
  private static useDocker: boolean | null = null; // Cache Docker availability check

  static async executeJavaScript(
    code: string,
    testCases: TestCase[]
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const testResults: TestResult[] = [];

    try {
      // Create temporary file
      const tempDir = tmpdir();
      const fileName = `solution_${Date.now()}.js`;
      const filePath = join(tempDir, fileName);

      // Write code to file
      await writeFile(filePath, code, "utf8");

      // Execute test cases
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const testResult = await this.runTestCase(
          filePath,
          testCase,
          i + 1,
          code
        );
        testResults.push(testResult);
      }

      // Clean up
      await this.cleanup(filePath);

      const executionTime = Date.now() - startTime;

      return {
        success: testResults.every((result) => result.status === "passed"),
        executionTime,
        testResults,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Execution failed",
        testResults,
      };
    }
  }

  /**
   * Check if Docker execution is available and preferred
   */
  private static async shouldUseDocker(): Promise<boolean> {
    // Check environment variable first
    const envUseDocker = process.env.USE_DOCKER_EXECUTOR;
    if (envUseDocker !== undefined) {
      return envUseDocker.toLowerCase() === "true";
    }

    // Cache the Docker availability check
    if (this.useDocker === null) {
      this.useDocker = await DockerExecutor.checkDockerAvailable();
    }

    return this.useDocker;
  }

  private static async runTestCase(
    filePath: string,
    testCase: TestCase,
    testNumber: number,
    originalCode: string
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const baseInput = testCase.input || "";
      let result: { output: string; error?: string };

      // Use Docker if available, otherwise fallback to direct execution
      const useDocker = await this.shouldUseDocker();
      const prepared = await this.prepareExecutionSource(
        originalCode,
        testCase
      );
      const executionInput =
        prepared.input !== undefined ? prepared.input : baseInput;

      if (useDocker) {
        // Execute using Docker
        const dockerResult = await DockerExecutor.executeCode(
          prepared.source,
          executionInput,
          {
            timeout: this.TIMEOUT,
            memoryLimit: this.MEMORY_LIMIT,
          }
        );

        result = {
          output: dockerResult.output || "",
          error: dockerResult.error,
        };
      } else {
        // Fallback to direct execution
        const tempExecutionPath =
          prepared.source === originalCode
            ? filePath
            : await this.writeTempExecutionFile(prepared.source, testNumber);

        try {
          const args = [tempExecutionPath];
          result = await this.executeCommand("node", args, executionInput);
        } finally {
          if (tempExecutionPath !== filePath) {
            await this.cleanup(tempExecutionPath);
          }
        }
      }

      const executionTime = Date.now() - startTime;
      const displayInput = this.formatDisplayInput(testCase, executionInput);

      // Normalize output for comparison
      const actualOutput = this.normalizeOutput(result.output);
      const expectedOutput = this.normalizeOutput(testCase.output);

      const status = actualOutput === expectedOutput ? "passed" : "failed";

      return {
        testCase: testNumber,
        status,
        input: displayInput,
        expectedOutput: testCase.output,
        actualOutput: result.output,
        executionTime,
        error: result.error,
      };
    } catch (error) {
      return {
        testCase: testNumber,
        status: "error",
        input: this.formatDisplayInput(testCase, testCase.input ?? ""),
        expectedOutput: testCase.output,
        error: error instanceof Error ? error.message : "Execution error",
        executionTime: Date.now() - startTime,
      };
    }
  }

  private static formatDisplayInput(
    testCase: TestCase,
    executionInput: string
  ): string {
    if (this.hasStructuredVariables(testCase)) {
      return this.formatVariables(testCase.variables || {});
    }

    if (executionInput && executionInput.trim().length > 0) {
      return executionInput;
    }

    if (testCase.input && testCase.input.trim().length > 0) {
      return testCase.input;
    }

    return "";
  }

  private static formatVariables(variables: Record<string, any>): string {
    const entries = Object.entries(variables || {});
    if (entries.length === 0) {
      return "";
    }

    return entries
      .map(([key, value]) => `${key}: ${this.stringifyVariableValue(value)}`)
      .join("\n");
  }

  private static stringifyVariableValue(value: any): string {
    if (typeof value === "string") {
      return value;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private static async executeCommand(
    command: string,
    args: string[],
    input: string
  ): Promise<{ output: string; error?: string }> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        stdio: ["pipe", "pipe", "pipe"],
        timeout: this.TIMEOUT,
      });

      let output = "";
      let error = "";

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.stderr.on("data", (data) => {
        error += data.toString();
      });

      process.on("close", (code) => {
        if (code === 0) {
          resolve({ output: output.trim() });
        } else {
          reject(new Error(error || `Process exited with code ${code}`));
        }
      });

      process.on("error", (err) => {
        reject(err);
      });

      // Send input to process
      process.stdin.write(input);
      process.stdin.end();
    });
  }

  private static normalizeOutput(output: string): string {
    return output
      .trim()
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\s+/g, " ");
  }

  private static async prepareExecutionSource(
    originalCode: string,
    testCase: TestCase
  ): Promise<{ source: string; input?: string }> {
    if (this.hasStructuredVariables(testCase)) {
      const candidateFunctions =
        this.extractCallableFunctionNames(originalCode);
      const harness = this.buildHarnessFromVariables(
        testCase,
        candidateFunctions
      );
      return {
        source: `${originalCode}\n\n${harness}`,
        input: "",
      };
    }

    return {
      source: originalCode,
      input: testCase.input || "",
    };
  }

  private static hasStructuredVariables(testCase: TestCase): boolean {
    return (
      !!testCase.variables &&
      typeof testCase.variables === "object" &&
      Object.keys(testCase.variables).length > 0
    );
  }

  private static buildHarnessFromVariables(
    testCase: TestCase,
    candidateFunctionNames: string[]
  ): string {
    const variables = testCase.variables || {};
    if (
      Array.isArray((variables as any).actions) &&
      Array.isArray((variables as any).values)
    ) {
      return this.buildClassHarness(variables as any);
    }
    return this.buildFunctionHarness(variables, candidateFunctionNames);
  }

  private static buildClassHarness(variables: {
    actions: string[];
    values: any[];
    timeDelays?: number[];
    timelays?: number[];
  }): string {
    const actions = JSON.stringify(variables.actions ?? []);
    const values = JSON.stringify(variables.values ?? []);
    const delays = JSON.stringify(
      Array.isArray(variables.timeDelays)
        ? variables.timeDelays
        : Array.isArray((variables as any).timelays)
        ? (variables as any).timelays
        : []
    );
    const constructorName = variables.actions?.[0] || "Constructor";
    const identifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
    const ctorResolution = identifierPattern.test(constructorName)
      ? `const __Ctor = typeof ${constructorName} !== "undefined" ? ${constructorName} : null;`
      : `const __Ctor = (typeof globalThis !== "undefined" && globalThis[${JSON.stringify(
          constructorName
        )}]) || null;`;

    return `(async () => {
  const __actions = ${actions};
  const __values = ${values};
  const __delays = ${delays};
  if (!Array.isArray(__actions) || __actions.length === 0) {
    throw new Error("No actions provided for class-based test case.");
  }

  const __results = [];
  let __currentTime = 0;
  const __originalDateNow = Date.now;
  const __hasPerformance =
    typeof globalThis !== "undefined" &&
    globalThis.performance &&
    typeof globalThis.performance.now === "function";
  const __originalPerformanceNow = __hasPerformance
    ? globalThis.performance.now.bind(globalThis.performance)
    : null;

  Date.now = () => __currentTime;
  if (__hasPerformance && __originalPerformanceNow) {
    globalThis.performance.now = () => __currentTime;
  }

  try {
    ${ctorResolution}
    if (!__Ctor) {
      throw new Error("Constructor ${constructorName} not found.");
    }

    const __ctorRaw = __values?.[0];
    const __ctorArgs = Array.isArray(__ctorRaw)
      ? __ctorRaw
      : __ctorRaw === undefined || __ctorRaw === null
      ? []
      : [__ctorRaw];
    let __instance = new __Ctor(...__ctorArgs);
    __results.push(null);

    for (let __i = 1; __i < __actions.length; __i++) {
      const __action = __actions[__i];
      const __rawArgs = __values?.[__i];
      const __args = Array.isArray(__rawArgs)
        ? __rawArgs
        : __rawArgs === undefined
        ? []
        : [__rawArgs];
      const __delay = Array.isArray(__delays)
        ? Number(__delays[__i] || 0)
        : 0;
      if (!Number.isNaN(__delay) && __delay > 0) {
        __currentTime += __delay;
      }

      if (!__instance || typeof __instance[__action] !== "function") {
        throw new Error(\`Method \${__action} not found on instance.\`);
      }

      const __result = __instance[__action](...__args);
      __results.push(__result === undefined ? null : __result);
    }

    console.log(JSON.stringify(__results));
  } finally {
    Date.now = __originalDateNow;
    if (__hasPerformance && __originalPerformanceNow) {
      globalThis.performance.now = __originalPerformanceNow;
    }
  }
})().catch((error) => {
  const hasMessage = error && typeof error === "object" && "message" in error;
  const message = hasMessage
    ? String(error.message ?? "")
    : String(error);
  console.error(message);
  process.exit(1);
});`;
  }

  private static extractCallableFunctionNames(code: string): string[] {
    const candidates: string[] = [];
    const seen = new Set<string>();
    const identifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
    const reserved = new Set([
      "main",
      "solution",
      "solve",
      "wordBreak",
      "defaultExport",
    ]);

    const addCandidate = (name: string) => {
      if (!identifierPattern.test(name)) {
        return;
      }
      if (reserved.has(name)) {
        return;
      }
      if (seen.has(name)) {
        return;
      }
      seen.add(name);
      candidates.push(name);
    };

    const functionDeclarationRegex =
      /\b(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;
    const exportFunctionRegex =
      /\bexport\s+(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;
    const assignedFunctionRegex =
      /\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?function\b/g;
    const arrowFunctionRegex =
      /\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?\([^=]*=>/g;

    let match: RegExpExecArray | null;

    while ((match = functionDeclarationRegex.exec(code))) {
      addCandidate(match[1]);
    }

    while ((match = exportFunctionRegex.exec(code))) {
      addCandidate(match[1]);
    }

    while ((match = assignedFunctionRegex.exec(code))) {
      addCandidate(match[1]);
    }

    while ((match = arrowFunctionRegex.exec(code))) {
      addCandidate(match[1]);
    }

    return candidates.slice(0, 10);
  }

  private static buildFunctionHarness(
    variables: Record<string, any>,
    candidateFunctionNames: string[]
  ): string {
    const entries = Object.entries(variables);
    const declarations = entries
      .map(
        ([name, value]) =>
          `const ${name} = ${this.serializeValueForCode(value)};`
      )
      .join("\n  ");
    const args = entries.map(([name]) => name).join(", ");
    const identifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
    const candidateChecks = candidateFunctionNames
      .filter((name) => identifierPattern.test(name))
      .map(
        (name) => `if (!__fn && typeof ${name} === "function") __fn = ${name};`
      )
      .join("\n  ");
    const candidateSection =
      candidateChecks.length > 0 ? `${candidateChecks}\n  ` : "";

    return `(async () => {
  ${declarations}

  let __fn = null;
  ${candidateSection}if (!__fn && typeof main === "function") __fn = main;
  if (!__fn && typeof solution === "function") __fn = solution;
  if (!__fn && typeof solve === "function") __fn = solve;
  if (!__fn && typeof wordBreak === "function") __fn = wordBreak;
  if (!__fn && typeof defaultExport === "function") __fn = defaultExport;
  if (
    !__fn &&
    typeof module !== "undefined" &&
    module &&
    module.exports
  ) {
    if (typeof module.exports === "function") {
      __fn = module.exports;
    } else if (
      typeof module.exports === "object" &&
      typeof module.exports.default === "function"
    ) {
      __fn = module.exports.default;
    }
  }

  if (!__fn) {
    throw new Error(
      "No callable function found. Please define a function or export one."
    );
  }

  const __result = __fn(${args});
  if (__result instanceof Promise) {
    console.log(JSON.stringify(await __result));
  } else {
    console.log(JSON.stringify(__result));
  }
})().catch((error) => {
  const hasMessage = error && typeof error === "object" && "message" in error;
  const message = hasMessage
    ? String(error.message ?? "")
    : String(error);
  console.error(message);
  process.exit(1);
});`;
  }

  private static serializeValueForCode(value: any): string {
    if (typeof value === "string") {
      return JSON.stringify(value);
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return JSON.stringify(value);
    }
    if (value === null) {
      return "null";
    }
    if (Array.isArray(value) || typeof value === "object") {
      return JSON.stringify(value);
    }
    return "undefined";
  }

  private static async writeTempExecutionFile(
    code: string,
    testNumber: number
  ): Promise<string> {
    const tempDir = tmpdir();
    const tempFilePath = join(
      tempDir,
      `dojohunt_run_${Date.now()}_${testNumber}_${Math.random()
        .toString(36)
        .slice(2)}.js`
    );
    await writeFile(tempFilePath, code, "utf8");
    return tempFilePath;
  }

  private static async cleanup(filePath: string): Promise<void> {
    try {
      await unlink(filePath).catch(() => {});
    } catch (error) {
      // Ignore cleanup errors
      console.warn("Cleanup failed:", error);
    }
  }

  // Validate JavaScript code for security
  static validateCode(
    code: string,
    language: string
  ): { valid: boolean; error?: string } {
    // Only validate JavaScript code
    if (language !== "javascript") {
      return {
        valid: false,
        error: "Only JavaScript is supported",
      };
    }

    const blacklistedPatterns = [
      /eval\s*\(/,
      /exec\s*\(/,
      /require\s*\(/,
      /process\./,
      /child_process/,
      /fs\./,
      /path\./,
      /import\s+[\"']fs[\"']/,
      /import\s+[\"']path[\"']/,
      /import\s+[\"']child_process[\"']/,
    ];

    for (const pattern of blacklistedPatterns) {
      if (pattern.test(code)) {
        return {
          valid: false,
          error: "Code contains forbidden patterns",
        };
      }
    }

    return { valid: true };
  }
}
