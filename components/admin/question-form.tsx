"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface QuestionFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function QuestionForm({
  initialData,
  onSubmit,
  onCancel,
}: QuestionFormProps) {
  // Convert old format to new format if needed
  const convertTestCases = (testCases: any[]) => {
    if (!testCases || testCases.length === 0) {
      return [{ variables: { s: "" }, output: "", explanation: "" }];
    }
    return testCases.map((tc) => {
      // If it's old format (has input string), convert it
      if (tc.input !== undefined) {
        // Try to parse as JSON or use as-is
        try {
          const parsed = JSON.parse(tc.input);
          if (typeof parsed === "object" && !Array.isArray(parsed)) {
            return {
              variables: parsed,
              output: tc.output || "",
              explanation: tc.explanation || "",
            };
          }
        } catch {
          // If not JSON, assume it's a single variable 's'
          return {
            variables: { s: tc.input },
            output: tc.output || "",
            explanation: tc.explanation || "",
          };
        }
      }
      // Already in new format
      return {
        variables: tc.variables || { s: "" },
        output: tc.output || "",
        explanation: tc.explanation || "",
      };
    });
  };

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    problem: initialData?.problem || "",
    difficulty: initialData?.difficulty || "EASY",
    category: initialData?.category || "",
    constraints: initialData?.constraints || [""],
    testCases: convertTestCases(
      initialData?.testCases || initialData?.examples || []
    ),
    timeLimit: initialData?.timeLimit || 1000,
    memoryLimit: initialData?.memoryLimit || 128,
    points: initialData?.points || 100,
    tags: initialData?.tags || [""],
    starterCode:
      initialData?.starterCode ||
      "function solution(params) {\n  // Your code here\n}",
    solutionCode:
      initialData?.solutionCode ||
      "function solution(params) {\n  // Solution code\n}",
  });

  // Track variable name inputs separately to prevent focus loss
  const [variableNameInputs, setVariableNameInputs] = useState<
    Record<string, string>
  >({});

  // Track raw variable value inputs to preserve what admin types
  const [variableValueInputs, setVariableValueInputs] = useState<
    Record<string, string>
  >({});

  // Initialize variable name inputs when test cases change
  useEffect(() => {
    const nameInputs: Record<string, string> = {};
    const valueInputs: Record<string, string> = {};
    formData.testCases.forEach((tc, tcIndex) => {
      Object.keys(tc.variables || {}).forEach((varName, varIndex) => {
        const nameKey = `${tcIndex}-${varIndex}`;
        const valueKey = `${tcIndex}-${varName}`;
        if (!nameInputs[nameKey]) {
          nameInputs[nameKey] = varName;
        }
        // Initialize raw value input only if not already set (preserve user's typing)
        if (variableValueInputs[valueKey] === undefined) {
          const varValue = tc.variables[varName];
          if (typeof varValue === "string") {
            // For strings, show raw value without JSON.stringify quotes
            valueInputs[valueKey] = varValue;
          } else if (typeof varValue === "number") {
            valueInputs[valueKey] = varValue.toString();
          } else if (typeof varValue === "boolean") {
            valueInputs[valueKey] = varValue.toString();
          } else if (varValue === null) {
            valueInputs[valueKey] = "null";
          } else {
            valueInputs[valueKey] = JSON.stringify(varValue);
          }
        }
      });
    });
    setVariableNameInputs((prev) => {
      // Only update if structure changed, preserve existing input values
      const keysChanged = Object.keys(nameInputs).some(
        (key) => !prev[key] || prev[key] !== nameInputs[key]
      );
      if (keysChanged) {
        return { ...prev, ...nameInputs };
      }
      return prev;
    });
    // Only set new value inputs, don't overwrite existing ones
    if (Object.keys(valueInputs).length > 0) {
      setVariableValueInputs((prev) => ({ ...prev, ...valueInputs }));
    }
  }, [formData.testCases.length]); // Only reinitialize when test cases are added/removed

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleCodeChange = (
    type: "starterCode" | "solutionCode",
    value: string
  ) => {
    setFormData({
      ...formData,
      [type]: value,
    });
  };

  const handleTestCaseVariableNameInput = (
    index: number,
    varIndex: number,
    newVarName: string
  ) => {
    // Update local input state immediately for smooth typing
    const key = `${index}-${varIndex}`;
    setVariableNameInputs({ ...variableNameInputs, [key]: newVarName });
  };

  const handleTestCaseVariableNameBlur = (
    index: number,
    varIndex: number,
    currentInputValue: string,
    oldVarName: string
  ) => {
    const trimmedNewName = currentInputValue.trim();

    // If empty, restore old name
    if (trimmedNewName === "") {
      const key = `${index}-${varIndex}`;
      setVariableNameInputs({ ...variableNameInputs, [key]: oldVarName });
      return;
    }

    // If unchanged, do nothing
    if (trimmedNewName === oldVarName) {
      return;
    }

    const updatedTestCases = [...formData.testCases];
    const currentVariables = { ...updatedTestCases[index].variables };
    const value = currentVariables[oldVarName];

    // Check for duplicate variable names
    if (currentVariables.hasOwnProperty(trimmedNewName)) {
      // Duplicate name detected - restore old name
      alert(
        `Variable name "${trimmedNewName}" already exists in this test case.`
      );
      const key = `${index}-${varIndex}`;
      setVariableNameInputs({ ...variableNameInputs, [key]: oldVarName });
      return;
    }

    // Rename the variable
    delete currentVariables[oldVarName];
    currentVariables[trimmedNewName] = value;
    updatedTestCases[index] = {
      ...updatedTestCases[index],
      variables: currentVariables,
    };
    setFormData({ ...formData, testCases: updatedTestCases });

    // Update the input state with the new name
    const key = `${index}-${varIndex}`;
    setVariableNameInputs({ ...variableNameInputs, [key]: trimmedNewName });

    // Update value input key when variable name changes
    const oldValueKey = `${index}-${oldVarName}`;
    const newValueKey = `${index}-${trimmedNewName}`;
    if (variableValueInputs[oldValueKey] !== undefined) {
      const updatedValueInputs = { ...variableValueInputs };
      updatedValueInputs[newValueKey] = updatedValueInputs[oldValueKey];
      delete updatedValueInputs[oldValueKey];
      setVariableValueInputs(updatedValueInputs);
    }
  };

  const parseVariableValue = (value: string): any => {
    const trimmed = value.trim();

    // Empty string
    if (trimmed === "") {
      return "";
    }

    // Try to parse as JSON first (handles arrays, objects, booleans, null, and double-quoted strings)
    try {
      const parsed = JSON.parse(trimmed);
      return parsed;
    } catch {
      // Not valid JSON, try other formats
    }

    // Handle single-quoted strings (not valid JSON, but common in user input)
    if (
      trimmed.startsWith("'") &&
      trimmed.endsWith("'") &&
      trimmed.length >= 2
    ) {
      // Remove outer quotes and return as string
      return trimmed.slice(1, -1);
    }

    // Try to parse as number (integer or float)
    if (/^-?\d+$/.test(trimmed)) {
      // Integer
      return parseInt(trimmed, 10);
    }
    if (/^-?\d*\.\d+$/.test(trimmed)) {
      // Float
      return parseFloat(trimmed);
    }

    // Try to parse as boolean
    if (trimmed.toLowerCase() === "true") return true;
    if (trimmed.toLowerCase() === "false") return false;

    // Try to parse as null
    if (trimmed.toLowerCase() === "null") return null;

    // Single character (if it's just one character without quotes)
    if (trimmed.length === 1 && !trimmed.match(/[0-9]/)) {
      return trimmed;
    }

    // Default: return as string (preserve the value as-is)
    return trimmed;
  };

  const handleTestCaseVariableChange = (
    index: number,
    varName: string,
    value: string
  ) => {
    // Store raw input value
    const key = `${index}-${varName}`;
    setVariableValueInputs({ ...variableValueInputs, [key]: value });

    const updatedTestCases = [...formData.testCases];
    const currentVariables = { ...updatedTestCases[index].variables };

    if (value.trim() === "") {
      // Keep the variable but set to empty string
      currentVariables[varName] = "";
    } else {
      currentVariables[varName] = parseVariableValue(value);
    }
    updatedTestCases[index] = {
      ...updatedTestCases[index],
      variables: currentVariables,
    };
    setFormData({ ...formData, testCases: updatedTestCases });
  };

  const handleTestCaseFieldChange = (
    index: number,
    field: "output" | "explanation",
    value: string
  ) => {
    const updatedTestCases = [...formData.testCases];
    updatedTestCases[index] = { ...updatedTestCases[index], [field]: value };
    setFormData({ ...formData, testCases: updatedTestCases });
  };

  const addTestCaseVariable = (index: number) => {
    const updatedTestCases = [...formData.testCases];
    const existingVars = Object.keys(updatedTestCases[index].variables || {});
    let newVarName = "var1";
    let counter = 1;
    while (existingVars.includes(newVarName)) {
      counter++;
      newVarName = `var${counter}`;
    }
    updatedTestCases[index] = {
      ...updatedTestCases[index],
      variables: { ...updatedTestCases[index].variables, [newVarName]: "" },
    };
    setFormData({ ...formData, testCases: updatedTestCases });

    // Initialize empty value input for new variable
    const valueKey = `${index}-${newVarName}`;
    setVariableValueInputs({ ...variableValueInputs, [valueKey]: "" });
  };

  const removeTestCaseVariable = (index: number, varName: string) => {
    const updatedTestCases = [...formData.testCases];
    const currentVariables = { ...updatedTestCases[index].variables };
    delete currentVariables[varName];
    updatedTestCases[index] = {
      ...updatedTestCases[index],
      variables: currentVariables,
    };
    setFormData({ ...formData, testCases: updatedTestCases });

    // Remove the stored raw value input
    const valueKey = `${index}-${varName}`;
    const updatedValueInputs = { ...variableValueInputs };
    delete updatedValueInputs[valueKey];
    setVariableValueInputs(updatedValueInputs);
  };

  const addTestCase = () => {
    setFormData({
      ...formData,
      testCases: [
        ...formData.testCases,
        { variables: { s: "" }, output: "", explanation: "" },
      ],
    });
  };

  const removeTestCase = (index: number) => {
    const updatedTestCases = formData.testCases.filter(
      (_: any, i: number) => i !== index
    );
    setFormData({ ...formData, testCases: updatedTestCases });
  };

  const handleConstraintChange = (index: number, value: string) => {
    const updatedConstraints = [...formData.constraints];
    updatedConstraints[index] = value;
    setFormData({ ...formData, constraints: updatedConstraints });
  };

  const addConstraint = () => {
    setFormData({
      ...formData,
      constraints: [...formData.constraints, ""],
    });
  };

  const removeConstraint = (index: number) => {
    if (formData.constraints.length > 1) {
      const updatedConstraints = formData.constraints.filter(
        (_: any, i: number) => i !== index
      );
      setFormData({ ...formData, constraints: updatedConstraints });
    }
  };

  const handleTagChange = (index: number, value: string) => {
    const updatedTags = [...formData.tags];
    updatedTags[index] = value;
    setFormData({ ...formData, tags: updatedTags });
  };

  const addTag = () => {
    setFormData({
      ...formData,
      tags: [...formData.tags, ""],
    });
  };

  const removeTag = (index: number) => {
    if (formData.tags.length > 1) {
      const updatedTags = formData.tags.filter(
        (_: any, i: number) => i !== index
      );
      setFormData({ ...formData, tags: updatedTags });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty values and prepare data for API
    const filteredData = {
      ...formData,
      constraints: formData.constraints.filter((c: string) => c.trim() !== ""),
      testCases: formData.testCases.filter(
        (t: any) =>
          Object.keys(t.variables || {}).length > 0 &&
          Object.values(t.variables || {}).some(
            (v: any) =>
              (typeof v === "string" && v.trim() !== "") ||
              (typeof v !== "string" && v !== null && v !== undefined)
          ) &&
          t.output.trim() !== ""
      ),
      tags: formData.tags.filter((t: string) => t.trim() !== ""),
    };

    onSubmit(filteredData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Question Title</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Two Sum"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="problem">Problem Statement</Label>
          <Textarea
            id="problem"
            name="problem"
            value={formData.problem}
            onChange={handleChange}
            placeholder="Detailed problem statement with examples and explanations..."
            className="min-h-[150px]"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value) => handleSelectChange("difficulty", value)}
            >
              <SelectTrigger id="difficulty">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g., Arrays, Strings, Dynamic Programming"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Constraints</Label>
        {formData.constraints.map((constraint: string, index: number) => (
          <div key={index} className="flex gap-2">
            <Input
              value={constraint}
              onChange={(e) => handleConstraintChange(index, e.target.value)}
              placeholder={`Constraint ${index + 1}`}
              required
            />
            {formData.constraints.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeConstraint(index)}
                className="h-10 w-10 p-0 text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={addConstraint}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Constraint
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Test Cases (Used for both Examples and Test Cases)</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Add test cases with variable inputs. The first few will be shown as
          examples in the problem description.
        </p>
        {formData.testCases.map(
          (
            testCase: {
              variables: Record<string, any>;
              output: string;
              explanation?: string;
            },
            index: number
          ) => (
            <Card key={index} className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Test Case {index + 1}</h4>
                  {formData.testCases.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTestCase(index)}
                      className="h-8 w-8 p-0 text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-4">
                  <div className="space-y-3">
                    <Label>Input Variables</Label>
                    {Object.entries(testCase.variables || {}).map(
                      ([varName, varValue], varIndex) => {
                        const inputKey = `${index}-${varIndex}`;
                        const inputValue =
                          variableNameInputs[inputKey] !== undefined
                            ? variableNameInputs[inputKey]
                            : varName;

                        return (
                          <div
                            key={inputKey}
                            className="grid gap-2 border rounded-lg p-3 bg-muted/30"
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex-1 grid grid-cols-[auto_1fr] gap-2 items-center">
                                <Input
                                  type="text"
                                  value={inputValue}
                                  onChange={(e) =>
                                    handleTestCaseVariableNameInput(
                                      index,
                                      varIndex,
                                      e.target.value
                                    )
                                  }
                                  onBlur={(e) =>
                                    handleTestCaseVariableNameBlur(
                                      index,
                                      varIndex,
                                      e.target.value,
                                      varName
                                    )
                                  }
                                  placeholder="Variable name"
                                  className="font-mono text-sm w-32"
                                  required
                                />
                                <span className="text-muted-foreground font-mono text-sm">
                                  =
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeTestCaseVariable(index, varName)
                                }
                                className="h-8 w-8 p-0 text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <Textarea
                              id={`testCase-${index}-var-${varName}`}
                              value={
                                variableValueInputs[`${index}-${varName}`] !==
                                undefined
                                  ? variableValueInputs[`${index}-${varName}`]
                                  : typeof varValue === "string"
                                  ? varValue // Show raw string without quotes
                                  : typeof varValue === "number"
                                  ? varValue.toString()
                                  : typeof varValue === "boolean"
                                  ? varValue.toString()
                                  : varValue === null
                                  ? "null"
                                  : JSON.stringify(varValue)
                              }
                              onChange={(e) =>
                                handleTestCaseVariableChange(
                                  index,
                                  varName,
                                  e.target.value
                                )
                              }
                              placeholder='Enter value: string "text", number 123, array [1,2,3], object {"key":"value"}, boolean true/false, character a'
                              className="min-h-[60px] font-mono text-sm"
                              required
                            />
                            <div className="text-xs text-muted-foreground">
                              Detected type:{" "}
                              <span className="font-semibold">
                                {typeof varValue === "string"
                                  ? "string"
                                  : typeof varValue === "number"
                                  ? "number"
                                  : typeof varValue === "boolean"
                                  ? "boolean"
                                  : Array.isArray(varValue)
                                  ? "array"
                                  : varValue === null
                                  ? "null"
                                  : typeof varValue === "object"
                                  ? "object"
                                  : typeof varValue}
                              </span>
                            </div>
                          </div>
                        );
                      }
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addTestCaseVariable(index)}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-3 w-3" /> Add Variable
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`testCase-${index}-output`}>
                      Expected Output
                    </Label>
                    <Textarea
                      id={`testCase-${index}-output`}
                      value={testCase.output}
                      onChange={(e) =>
                        handleTestCaseFieldChange(
                          index,
                          "output",
                          e.target.value
                        )
                      }
                      placeholder='e.g., ["cats and dog", "cat sand dog"]'
                      className="min-h-[80px] font-mono text-sm"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`testCase-${index}-explanation`}>
                      Explanation (Optional)
                    </Label>
                    <Textarea
                      id={`testCase-${index}-explanation`}
                      value={testCase.explanation || ""}
                      onChange={(e) =>
                        handleTestCaseFieldChange(
                          index,
                          "explanation",
                          e.target.value
                        )
                      }
                      placeholder="Explain why this is the expected output..."
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        )}
        <Button
          type="button"
          variant="outline"
          onClick={addTestCase}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Test Case
        </Button>
      </div>

      <div className="space-y-4">
        <Label>Configuration</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="timeLimit">Time Limit (ms)</Label>
            <Input
              id="timeLimit"
              name="timeLimit"
              type="number"
              value={formData.timeLimit}
              onChange={handleChange}
              min="100"
              max="10000"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="memoryLimit">Memory Limit (MB)</Label>
            <Input
              id="memoryLimit"
              name="memoryLimit"
              type="number"
              value={formData.memoryLimit}
              onChange={handleChange}
              min="64"
              max="512"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              name="points"
              type="number"
              value={formData.points}
              onChange={handleChange}
              min="10"
              max="1000"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          {formData.tags.map((tag: string, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={tag}
                onChange={(e) => handleTagChange(index, e.target.value)}
                placeholder={`Tag ${index + 1}`}
                required
              />
              {formData.tags.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeTag(index)}
                  className="h-10 w-10 p-0 text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addTag}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Tag
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Code Templates</Label>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="starterCode">Starter Code (JavaScript)</Label>
            <Textarea
              id="starterCode"
              value={formData.starterCode}
              onChange={(e) => handleCodeChange("starterCode", e.target.value)}
              className="font-mono min-h-[200px]"
              placeholder="function solution(params) {&#10;  // Your code here&#10;}"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="solutionCode">Solution Code (JavaScript)</Label>
            <Textarea
              id="solutionCode"
              value={formData.solutionCode}
              onChange={(e) => handleCodeChange("solutionCode", e.target.value)}
              className="font-mono min-h-[200px]"
              placeholder="function solution(params) {&#10;  // Solution code&#10;}"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? "Update Question" : "Add Question"}
        </Button>
      </div>
    </form>
  );
}
