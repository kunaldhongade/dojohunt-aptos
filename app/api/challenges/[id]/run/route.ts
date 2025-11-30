import { CodeExecutor, TestCase } from "@/lib/code-executor";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Simplified schema for Zod v4 compatibility
// Use z.any() instead of z.unknown() for better compatibility
const runCodeSchema = z.object({
  code: z.string().min(1, "Code is required"),
  testCase: z
    .object({
      variables: z.any().optional(), // Accept any object structure
      input: z.string().optional(), // Old format: backward compatibility
      expectedOutput: z.string().optional(),
    })
    .optional(),
  testCases: z
    .array(
      z.object({
        variables: z.any().optional(), // Accept any object structure
        input: z.string().optional(),
        expectedOutput: z.string().optional(),
      })
    )
    .optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate request body with Zod schema using safeParse for better error handling
    let parsedBody;
    const validationResult = runCodeSchema.safeParse(body);

    if (!validationResult.success) {
      console.error("Zod validation error:", validationResult.error);
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationResult.error.issues || "Invalid request format",
        },
        { status: 400 }
      );
    }

    parsedBody = validationResult.data;

    const { code, testCase, testCases } = parsedBody;

    // Validate code for security
    const validation = CodeExecutor.validateCode(code, "javascript");
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Handle both single testCase (backward compatibility) and testCases array
    let normalizedTestCases: TestCase[] = [];

    if (testCases && testCases.length > 0) {
      // New format: multiple test cases
      normalizedTestCases = testCases
        .map((tc) => normalizeTestCase(tc))
        .filter((tc): tc is TestCase => tc !== null);
    } else if (testCase) {
      // Old format: single test case (backward compatibility)
      const normalized = normalizeTestCase(testCase);
      if (normalized) {
        normalizedTestCases = [normalized];
      }
    }

    if (normalizedTestCases.length === 0) {
      return NextResponse.json({
        success: true,
        testResults: [],
        executionTime: 0,
      });
    }

    const executionResult = await CodeExecutor.executeJavaScript(
      code,
      normalizedTestCases
    );

    // If only one test case (backward compatibility), return single result format
    if (normalizedTestCases.length === 1 && !testCases) {
      const runResult = executionResult.testResults?.[0];

      if (!runResult) {
        return NextResponse.json(
          {
            success: false,
            error: "No execution result returned",
          },
          { status: 500 }
        );
      }

      if (runResult.status === "error") {
        return NextResponse.json(
          {
            success: false,
            error:
              runResult.error || executionResult.error || "Execution error",
            executionTime:
              runResult.executionTime ?? executionResult.executionTime ?? 0,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: runResult.status === "passed",
        status: runResult.status,
        output: runResult.actualOutput ?? "",
        expectedOutput: normalizedTestCases[0].output,
        executionTime:
          runResult.executionTime ?? executionResult.executionTime ?? 0,
        error: runResult.error,
      });
    }

    // Multiple test cases: return all results
    const allPassed =
      executionResult.testResults?.every(
        (result) => result.status === "passed"
      ) ?? false;

    return NextResponse.json({
      success: allPassed,
      testResults: executionResult.testResults || [],
      executionTime: executionResult.executionTime ?? 0,
      error: executionResult.error,
    });
  } catch (error) {
    console.error("Run code error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function normalizeTestCase(input?: {
  variables?: Record<string, any>;
  expectedOutput?: string;
  input?: string;
}): TestCase | null {
  if (!input) {
    return null;
  }

  if (input.variables && Object.keys(input.variables).length > 0) {
    return {
      variables: input.variables,
      output: input.expectedOutput ?? "",
      input: "",
    };
  }

  if (typeof input.input === "string") {
    return {
      input: input.input,
      output: input.expectedOutput ?? "",
    };
  }

  if (input.expectedOutput) {
    return {
      input: "",
      output: input.expectedOutput,
    };
  }

  return null;
}
