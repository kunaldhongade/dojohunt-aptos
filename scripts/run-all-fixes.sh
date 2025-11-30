#!/bin/bash

# Script to run all diagnostic and fix scripts
echo "=========================================="
echo "DojoHunt Database Diagnostic & Fix Script"
echo "=========================================="
echo ""

echo "Step 1: Verifying stakes and submissions..."
node scripts/verify-stakes-saved.js

echo ""
echo "Step 2: Fixing userId mismatches and data inconsistencies..."
node scripts/fix-userid-mismatches.js

echo ""
echo "Step 3: Verifying fixes..."
node scripts/verify-stakes-saved.js

echo ""
echo "=========================================="
echo "All scripts completed!"
echo "=========================================="

