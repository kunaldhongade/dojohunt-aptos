#!/usr/bin/env node
/**
 * Node.js Code Execution Runner
 * This script runs user code in a sandboxed environment using Node.js V8 engine
 * Similar to LeetCode's execution environment
 */

const fs = require('fs');
const { spawn } = require('child_process');

// Read code from file
const codePath = process.argv[2] || '/app/code/solution.js';
const inputPath = process.argv[3] || '/app/code/input.txt';

// Read the code
let code = '';
if (fs.existsSync(codePath)) {
  code = fs.readFileSync(codePath, 'utf8');
} else {
  process.stderr.write(`Error: Code file not found at ${codePath}\n`);
  process.exit(1);
}

// Read input if provided
let input = '';
if (fs.existsSync(inputPath)) {
  input = fs.readFileSync(inputPath, 'utf8');
}

// Create a wrapper script that includes the code and handles input/output
const wrapperCode = `
const readline = require('readline');

// Read input from stdin or environment
let inputData = ${JSON.stringify(input)};

// Create readline interface for input parsing
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Store input lines
let inputLines = inputData ? inputData.trim().split('\\n') : [];
let lineIndex = 0;

// Helper function to read input line by line (LeetCode style)
function readLine() {
  if (lineIndex < inputLines.length) {
    return inputLines[lineIndex++];
  }
  return '';
}

// Helper function to read all input
function readAllInput() {
  return inputData;
}

// User's code
${code}

// Close readline interface
rl.close();
`;

// Write wrapper code to a temporary file
const wrapperPath = '/tmp/wrapper.js';
fs.writeFileSync(wrapperPath, wrapperCode, 'utf8');

// Execute the wrapper code using Node.js
const nodeProcess = spawn('node', [wrapperPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  timeout: 5000, // 5 second timeout
});

// Send input to the process if needed
if (input) {
  nodeProcess.stdin.write(input);
}
nodeProcess.stdin.end();

let stdout = '';
let stderr = '';

nodeProcess.stdout.on('data', (data) => {
  stdout += data.toString();
});

nodeProcess.stderr.on('data', (data) => {
  stderr += data.toString();
});

nodeProcess.on('close', (code) => {
  // Clean up wrapper file
  try {
    fs.unlinkSync(wrapperPath);
  } catch (e) {
    // Ignore cleanup errors
  }

  if (code === 0) {
    process.stdout.write(stdout);
    process.exit(0);
  } else {
    process.stderr.write(stderr || `Process exited with code ${code}\n`);
    process.exit(code || 1);
  }
});

nodeProcess.on('error', (error) => {
  try {
    fs.unlinkSync(wrapperPath);
  } catch (e) {
    // Ignore cleanup errors
  }
  process.stderr.write(`Error: ${error.message}\n`);
  process.exit(1);
});

// Handle timeout
setTimeout(() => {
  nodeProcess.kill('SIGTERM');
  try {
    fs.unlinkSync(wrapperPath);
  } catch (e) {
    // Ignore cleanup errors
  }
  process.stderr.write('Execution Timeout: Code execution exceeded 5 seconds\n');
  process.exit(124); // 124 is the exit code for timeout
}, 5000);

