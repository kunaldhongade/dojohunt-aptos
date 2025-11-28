"use client";

import { Navbar } from "@/components/navbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Editor from "@monaco-editor/react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Menu,
  Play,
  RotateCcw,
  Send,
  Terminal,
  X,
  XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  problem: string;
  difficulty: string;
  category: string;
  constraints: string[];
  examples: any[];
  testCases: any[];
  starterCode: string;
  solutionCode: string;
  timeLimit: number;
  memoryLimit: number;
  points: number;
  tags: string[];
}

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTime: number;
}

interface SubmissionResult {
  success: boolean;
  testResults: TestResult[];
  executionTime: number;
  errorMessage?: string;
}

interface RunExecutionResult {
  output?: string;
  expectedOutput?: string;
  status?: "passed" | "failed" | "error";
  success?: boolean;
  error?: string;
  executionTime?: number;
  testResults?: Array<{
    testCase: number;
    status: "passed" | "failed" | "error";
    input: string;
    expectedOutput: string;
    actualOutput?: string;
    executionTime?: number;
    error?: string;
  }>;
}

interface SubmissionStatus {
  isCompleted: boolean;
  status: string;
  testResults: any[];
  executionTime: number;
  completedAt?: Date;
}

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const challengeId = params.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null);
  const [runOutput, setRunOutput] = useState<RunExecutionResult | null>(null);
  const [selectedTestCase, setSelectedTestCase] = useState(0);
  const [customTestCases, setCustomTestCases] = useState<
    Array<{
      variables: Record<string, any>;
      expectedOutput: string;
    }>
  >([]);
  const [problemPanelOpen, setProblemPanelOpen] = useState(true);
  const [outputPanelOpen, setOutputPanelOpen] = useState(false);
  const [previousSubmission, setPreviousSubmission] =
    useState<SubmissionStatus | null>(null);

  useEffect(() => {
    if (challengeId) {
      fetchChallenge();
    }
  }, [challengeId]);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/challenges/${challengeId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch challenge");
      }

      const data = await response.json();

      if (!data.success || !data.challenge) {
        throw new Error("Invalid challenge data received");
      }

      setChallenge(data.challenge);
      setCode(String(data.challenge.starterCode || ""));

      // Store previous submission status if available
      if (data.submissionStatus) {
        setPreviousSubmission(data.submissionStatus);
      } else {
        setPreviousSubmission(null);
      }

      if (data.challenge.testCases && data.challenge.testCases.length > 0) {
        const mappedTestCases = data.challenge.testCases.map(
          (testCase: any) => {
            if (testCase.variables) {
              return {
                variables: testCase.variables,
                expectedOutput:
                  testCase.output || testCase.expectedOutput || "",
              };
            } else if (testCase.input) {
              try {
                const parsed = JSON.parse(testCase.input);
                if (typeof parsed === "object" && !Array.isArray(parsed)) {
                  return {
                    variables: parsed,
                    expectedOutput:
                      testCase.output || testCase.expectedOutput || "",
                  };
                }
              } catch {
                return {
                  variables: { s: testCase.input },
                  expectedOutput:
                    testCase.output || testCase.expectedOutput || "",
                };
              }
            }
            return {
              variables: { s: "" },
              expectedOutput: testCase.output || testCase.expectedOutput || "",
            };
          }
        );
        setCustomTestCases(mappedTestCases);
      } else {
        setCustomTestCases([]);
      }
    } catch (err) {
      console.error("Error fetching challenge:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load challenge. Please try again later."
      );
      setChallenge(null);
      setCustomTestCases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCode = async () => {
    if (!challenge || !String(code).trim()) return;
    if (!customTestCases || customTestCases.length === 0) {
      setRunOutput({
        output: "",
        error: "No test cases available. Please refresh the page.",
        executionTime: 0,
        status: "error",
        success: false,
      });
      setOutputPanelOpen(true);
      return;
    }

    setIsRunning(true);
    setRunOutput(null);
    setOutputPanelOpen(true);

    try {
      const requestBody = {
        code: code,
        testCases: customTestCases.map((tc) => ({
          variables: tc.variables,
          expectedOutput: tc.expectedOutput,
        })),
      };

      const response = await fetch(`/api/challenges/${challengeId}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.testResults && Array.isArray(data.testResults)) {
          setRunOutput({
            testResults: data.testResults,
            executionTime:
              typeof data.executionTime === "number" ? data.executionTime : 0,
            status: data.success ? "passed" : "failed",
            success: data.success,
            error: data.error,
          });
        } else {
          const normalizedOutput =
            data.output !== undefined && data.output !== null
              ? String(data.output)
              : "";
          const normalizedExpected =
            data.expectedOutput !== undefined && data.expectedOutput !== null
              ? String(data.expectedOutput)
              : undefined;

          setRunOutput({
            output: normalizedOutput,
            expectedOutput: normalizedExpected,
            executionTime:
              typeof data.executionTime === "number" ? data.executionTime : 0,
            status: data.status,
            success: data.success,
            error: data.error,
          });
        }
      } else {
        setRunOutput({
          output: "",
          error: data.error || data.details || "Code execution failed",
          executionTime:
            typeof data.executionTime === "number" ? data.executionTime : 0,
          status: "error",
          success: false,
        });
      }
    } catch (err) {
      console.error("Run code error:", err);
      setRunOutput({
        output: "",
        error: "Network error. Please try again.",
        executionTime: 0,
        status: "error",
        success: false,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!challenge || !String(code).trim()) return;

    if (sessionStatus === "loading") {
      return;
    }

    if (sessionStatus === "unauthenticated" || !session) {
      router.push("/auth/signin?callbackUrl=/challenges/" + challengeId);
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);
    setOutputPanelOpen(true);

    try {
      const response = await fetch(`/api/challenges/${challengeId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          code: code,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmissionResult({
          success: data.success,
          testResults: data.data?.testResults || [],
          executionTime: data.data?.executionTime || 0,
          errorMessage: data.data?.errorMessage,
        });

        if (data.success) {
          console.log("Solution submitted successfully!");
          // Refresh challenge to get updated submission status
          await fetchChallenge();
        }
      } else {
        if (response.status === 401) {
          router.push("/auth/signin?callbackUrl=/challenges/" + challengeId);
          return;
        }

        setSubmissionResult({
          success: false,
          testResults: [],
          executionTime: 0,
          errorMessage: data.error || "Submission failed",
        });
      }
    } catch (err) {
      console.error("Submission error:", err);
      setSubmissionResult({
        success: false,
        testResults: [],
        executionTime: 0,
        errorMessage: "Network error. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCode = () => {
    if (challenge) {
      setCode(String(challenge.starterCode || ""));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "hard":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-foreground/70">Loading challenge...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="glass-strong border-red-500/30 max-w-md text-center">
            <CardContent className="p-8">
              <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-display font-bold mb-2 text-red-400">
                Challenge Not Found
              </h2>
              <p className="text-foreground/70">
                {error || "The requested challenge could not be found."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Navbar variant="compact" isWide={false} />
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 pt-10">
        {/* Top Bar - Challenge Info */}
        <div className="flex-shrink-0 border-b border-border/30 bg-card/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="h-8 px-2 glass-light hover:glass border-border/50 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="h-5 w-px bg-border/30" />
              <div className="flex items-center gap-2">
                <h1 className="text-base font-display font-semibold text-foreground">
                  {challenge.title}
                </h1>
                <Badge
                  className={`${getDifficultyColor(
                    challenge.difficulty
                  )} border text-xs font-medium px-2 py-0.5`}
                >
                  {challenge.difficulty}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetCode}
                className="h-8 px-2 glass-light hover:glass border-border/50 rounded-lg text-xs"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area - Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Problem Description */}
          <div
            className={`${
              problemPanelOpen ? "w-full md:w-[420px] lg:w-[480px]" : "w-0"
            } flex-shrink-0 border-r border-border/20 bg-[#1a1d2e] backdrop-blur-md transition-all duration-300 overflow-hidden flex flex-col`}
          >
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border/20 bg-[#151721]">
              <h2 className="text-sm font-semibold text-foreground/90">
                Problem
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setProblemPanelOpen(false)}
                className="h-7 w-7 hover:bg-background/20 border-0 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto bg-[#1a1d2e]">
              <div className="p-5 space-y-5">
                {/* Problem Description */}
                <div className="prose prose-invert max-w-none">
                  <div className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {challenge.problem}
                  </div>
                </div>

                {/* Examples */}
                {(challenge.testCases || challenge.examples || [])
                  .slice(0, 3)
                  .map((testCase: any, index: number) => {
                    const variables =
                      testCase.variables ||
                      (testCase.input ? { input: testCase.input } : {});
                    const output = testCase.output || "";
                    const explanation = testCase.explanation;

                    return (
                      <div key={index} className="space-y-3">
                        <h3 className="font-semibold text-foreground/90 text-sm">
                          Example {index + 1}:
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs font-medium text-foreground/70 mb-2">
                              Input:
                            </div>
                            <div className="bg-[#0f1117] border border-border/20 p-3 rounded-lg">
                              <pre className="text-sm font-mono text-foreground/90 whitespace-pre-wrap">
                                {Object.entries(variables)
                                  .map(([key, value]) => {
                                    const valStr =
                                      typeof value === "string"
                                        ? value
                                        : JSON.stringify(value);
                                    return `${key} = ${valStr}`;
                                  })
                                  .join("\n")}
                              </pre>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-foreground/70 mb-2">
                              Output:
                            </div>
                            <div className="bg-[#0f1117] border border-border/20 p-3 rounded-lg">
                              <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap">
                                {output}
                              </pre>
                            </div>
                          </div>
                          {explanation && (
                            <div>
                              <div className="text-xs font-medium text-foreground/70 mb-2">
                                Explanation:
                              </div>
                              <div className="text-sm text-foreground/70 leading-relaxed bg-[#151721] p-3 rounded-lg border border-border/10">
                                {explanation}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                {/* Constraints */}
                <div>
                  <h3 className="font-semibold text-foreground/90 text-sm mb-3">
                    Constraints:
                  </h3>
                  <ul className="space-y-2 text-sm text-foreground/70">
                    {challenge.constraints.map((constraint, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 bg-[#151721] p-2.5 rounded-lg border border-border/10"
                      >
                        <span className="text-primary mt-0.5">•</span>
                        <span className="flex-1">{constraint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Button for Problem Panel */}
          {!problemPanelOpen && (
            <button
              onClick={() => setProblemPanelOpen(true)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 glass-strong border-r border-border/30 rounded-r-lg hover:bg-primary/10 transition-colors shadow-lg"
            >
              <ChevronRight className="h-4 w-4 text-foreground/60" />
            </button>
          )}

          {/* Center Panel - Code Editor */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
            {/* Editor Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-border/30 bg-card/80 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Badge className="glass border-border/50 text-xs px-2 py-0.5">
                  JavaScript
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRunCode}
                  disabled={isRunning || !String(code).trim()}
                  className="h-8 px-3 glass-light hover:glass border-border/50 rounded-lg text-xs font-medium"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Running
                    </>
                  ) : (
                    <>
                      <Play className="mr-1.5 h-3.5 w-3.5" />
                      Run
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitSolution}
                  disabled={isSubmitting || !String(code).trim()}
                  className="h-8 px-3 gradient-purple hover:opacity-90 rounded-lg text-xs font-medium shadow-lg shadow-primary/30"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Submitting
                    </>
                  ) : (
                    <>
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      Submit
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Monaco Editor - Full Height */}
            <div className="flex-1 relative min-h-0">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                value={String(code)}
                onChange={(value) => setCode(value || "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 15,
                  lineNumbers: "on",
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  insertSpaces: true,
                  wordWrap: "off",
                  padding: { top: 16, bottom: 16 },
                  lineHeight: 22,
                  fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
                  fontLigatures: true,
                  cursorStyle: "line",
                  cursorBlinking: "smooth",
                  renderWhitespace: "selection",
                  renderLineHighlight: "line",
                  occurrencesHighlight: "singleFile",
                  selectionHighlight: true,
                  matchBrackets: "always",
                  bracketPairColorization: { enabled: true },
                  smoothScrolling: true,
                  mouseWheelZoom: false,
                  contextmenu: true,
                  formatOnPaste: false,
                  formatOnType: false,
                  suggestOnTriggerCharacters: true,
                  acceptSuggestionOnEnter: "on",
                  tabCompletion: "on",
                  wordBasedSuggestions: "allDocuments",
                }}
              />
            </div>

            {/* Bottom Panel - Output/Test Results (Collapsible) */}
            {outputPanelOpen && (
              <div className="flex-shrink-0 border-t border-border/30 bg-card/80 backdrop-blur-md">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-foreground/60" />
                    <span className="text-sm font-medium text-foreground/90">
                      {submissionResult
                        ? "Submission Result"
                        : runOutput
                        ? "Test Result"
                        : "Console"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOutputPanelOpen(false)}
                    className="h-7 w-7 glass-light hover:glass border-border/50 rounded-lg"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="max-h-[200px] overflow-y-auto p-4">
                  {submissionResult ? (
                    <div className="space-y-3">
                      <div
                        className={`flex items-center gap-2 p-3 rounded-lg ${
                          submissionResult.success
                            ? "glass-light border border-green-500/30 bg-green-500/5"
                            : "glass-light border border-red-500/30 bg-red-500/5"
                        }`}
                      >
                        {submissionResult.success ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                            <span className="text-sm font-semibold text-green-400">
                              Accepted
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-red-400" />
                            <span className="text-sm font-semibold text-red-400">
                              Wrong Answer
                            </span>
                          </>
                        )}
                        <span className="text-xs text-foreground/60 ml-auto">
                          {submissionResult.executionTime}ms
                        </span>
                      </div>
                      {submissionResult.testResults && (
                        <div className="space-y-2">
                          {submissionResult.testResults.map((result, index) => (
                            <div
                              key={index}
                              className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                                result.passed
                                  ? "glass-light border border-green-500/20"
                                  : "glass-light border border-red-500/20"
                              }`}
                            >
                              {result.passed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-400" />
                              )}
                              <span className="font-mono">
                                Test {index + 1}:{" "}
                                {result.passed ? "Passed" : "Failed"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {submissionResult.errorMessage && (
                        <div className="glass-light border border-red-500/30 p-3 rounded-lg">
                          <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap">
                            {submissionResult.errorMessage}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : runOutput ? (
                    <div className="space-y-3">
                      {/* Show banner if challenge is already completed */}
                      {previousSubmission?.isCompleted && (
                        <div
                          className={`flex items-center gap-2 p-3 rounded-lg border ${
                            previousSubmission.status === "ACCEPTED"
                              ? "glass-light border-green-500/30 bg-green-500/5"
                              : "glass-light border-yellow-500/30 bg-yellow-500/5"
                          }`}
                        >
                          {previousSubmission.status === "ACCEPTED" ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                              <div className="flex-1">
                                <span className="text-sm font-semibold text-green-400">
                                  Accepted
                                </span>
                                <span className="text-xs text-foreground/60 ml-2">
                                  but challenge is already submitted
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                              <div className="flex-1">
                                <span className="text-sm font-semibold text-yellow-400">
                                  Wrong Answer
                                </span>
                                <span className="text-xs text-foreground/60 ml-2">
                                  but challenge is already submitted
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      {/* Also show banner if there's a previous submission (even if not completed) */}
                      {previousSubmission &&
                        !previousSubmission.isCompleted && (
                          <div className="flex items-center gap-2 p-3 rounded-lg border glass-light border-yellow-500/30 bg-yellow-500/5">
                            <XCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="text-sm font-semibold text-yellow-400">
                                Wrong Answer
                              </span>
                              <span className="text-xs text-foreground/60 ml-2">
                                but challenge is already submitted
                              </span>
                            </div>
                          </div>
                        )}
                      {runOutput.testResults &&
                      runOutput.testResults.length > 0 ? (
                        <>
                          <div className="flex gap-2 flex-wrap">
                            {runOutput.testResults.map((result, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedTestCase(index)}
                                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                                  selectedTestCase === index
                                    ? "glass-strong border border-primary text-primary"
                                    : "glass-light border border-border/30 text-foreground/60 hover:text-foreground"
                                }`}
                              >
                                {result.status === "passed" ? (
                                  <CheckCircle2 className="h-3 w-3 inline mr-1 text-green-400" />
                                ) : (
                                  <XCircle className="h-3 w-3 inline mr-1 text-red-400" />
                                )}
                                Case {result.testCase}
                              </button>
                            ))}
                          </div>
                          {runOutput.testResults[selectedTestCase] && (
                            <div className="space-y-2">
                              <div>
                                <div className="text-xs font-medium text-foreground/70 mb-1">
                                  Output:
                                </div>
                                <div className="glass-light border border-border/30 p-2 rounded font-mono text-xs">
                                  {runOutput.testResults[selectedTestCase]
                                    .error ||
                                    runOutput.testResults[selectedTestCase]
                                      .actualOutput ||
                                    "No output"}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-foreground/70 mb-1">
                                  Expected:
                                </div>
                                <div className="glass-light border border-border/30 p-2 rounded font-mono text-xs">
                                  {
                                    runOutput.testResults[selectedTestCase]
                                      .expectedOutput
                                  }
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-2">
                          {runOutput.error && (
                            <div className="glass-light border border-red-500/30 p-3 rounded-lg">
                              <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap">
                                {runOutput.error}
                              </pre>
                            </div>
                          )}
                          {runOutput.output && (
                            <div>
                              <div className="text-xs font-medium text-foreground/70 mb-1">
                                Output:
                              </div>
                              <div className="glass-light border border-border/30 p-2 rounded font-mono text-xs text-foreground/90">
                                {runOutput.output}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-foreground/50">
                      Click "Run" to execute your code
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Show Output Button when panel is closed */}
            {!outputPanelOpen && (runOutput || submissionResult) && (
              <button
                onClick={() => setOutputPanelOpen(true)}
                className="absolute bottom-4 right-4 p-2.5 glass-strong border border-border/30 rounded-lg hover:bg-primary/10 transition-colors shadow-lg z-10"
              >
                <Terminal className="h-4 w-4 text-foreground/60" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
