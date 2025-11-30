# DojoHunt Database Diagnostic & Fix Scripts

This directory contains scripts to diagnose and fix issues with the leaderboard and database consistency.

## Scripts Overview

### 1. `diagnose-leaderboard.js`
**Purpose**: Comprehensive database analysis to understand the current state.

**What it does**:
- Lists all users, stakes, submissions, and userStats
- Shows cross-references between collections
- Identifies data inconsistencies
- Checks userId type consistency

**Usage**:
```bash
node scripts/diagnose-leaderboard.js
```

### 2. `check-real-users.js`
**Purpose**: Check specific users for stakes and submissions.

**What it does**:
- Lists all users in the database
- Checks each user for stakes and submissions
- Handles both ObjectId and string userId formats
- Shows userId type mismatches

**Usage**:
```bash
node scripts/check-real-users.js
```

### 3. `verify-stakes-saved.js`
**Purpose**: Verify that stakes and submissions are saved correctly.

**What it does**:
- Checks all active users for stakes and submissions
- Verifies userId matches (ObjectId or string)
- Validates data integrity (amounts, scores, etc.)
- Compares userStats with calculated values from source collections
- Reports any issues found

**Usage**:
```bash
node scripts/verify-stakes-saved.js
```

### 4. `fix-userid-mismatches.js`
**Purpose**: Fix userId type mismatches and recalculate userStats.

**What it does**:
- Converts string userIds to ObjectIds in stakes collection
- Converts string userIds to ObjectIds in submissions collection
- Recalculates userStats from source collections (stakes and submissions)
- Creates missing userStats records
- Updates outdated userStats records

**Usage**:
```bash
node scripts/fix-userid-mismatches.js
```

### 5. `test-leaderboard-api.js`
**Purpose**: Test the leaderboard API endpoint.

**What it does**:
- Makes a request to the leaderboard API
- Shows the response data
- Displays user stats summary

**Usage**:
```bash
# Make sure your Next.js dev server is running on port 3000
node scripts/test-leaderboard-api.js
```

### 6. `run-all-fixes.sh` / `run-all-fixes.bat`
**Purpose**: Run all diagnostic and fix scripts in sequence.

**What it does**:
1. Verifies current state
2. Applies fixes
3. Verifies fixes were applied

**Usage**:
```bash
# Linux/Mac
bash scripts/run-all-fixes.sh

# Windows
scripts\run-all-fixes.bat
```

## Quick Start

### Step 1: Diagnose the Issue
```bash
node scripts/diagnose-leaderboard.js
```

### Step 2: Verify Data Integrity
```bash
node scripts/verify-stakes-saved.js
```

### Step 3: Fix Issues
```bash
node scripts/fix-userid-mismatches.js
```

### Step 4: Verify Fixes
```bash
node scripts/verify-stakes-saved.js
```

## API Logging

The following API endpoints now have detailed logging:

### Staking API (`/api/staking/stake`)
- Logs when stake records are created
- Logs when userStats are updated
- Shows userId, amount, transaction hash, etc.

### Submission API (`/api/challenges/[id]/submit`)
- Logs when submissions are created
- Logs when submissions are accepted/rejected
- Logs when userStats are updated

### Unstake API (`/api/staking/unstake`)
- Logs when unstake transactions are verified
- Logs when stake status is updated
- Logs when userStats are updated

**To view logs**: Check your Next.js server console when these APIs are called.

## Common Issues and Fixes

### Issue: Leaderboard shows zeros for users who have staked
**Cause**: userId type mismatch or userStats not calculated correctly
**Fix**: Run `fix-userid-mismatches.js`

### Issue: Stakes/submissions not showing up
**Cause**: userId stored as string instead of ObjectId
**Fix**: Run `fix-userid-mismatches.js` (it converts string userIds to ObjectIds)

### Issue: userStats doesn't match actual data
**Cause**: userStats not updated when stakes/submissions are created
**Fix**: Run `fix-userid-mismatches.js` (it recalculates from source collections)

## Database Structure

### Collections:
- **users**: User accounts
- **stakes**: Staking records (userId should be ObjectId)
- **submissions**: Challenge submissions (userId should be ObjectId)
- **userStats**: Aggregated user statistics (calculated from stakes and submissions)

### Important Notes:
- All `userId` fields should be ObjectId type (not strings)
- `userStats` is calculated from `stakes` and `submissions` collections
- The leaderboard API calculates stats directly from source collections for accuracy

## Troubleshooting

### Script fails to connect to MongoDB
- Check your `.env` file has `MONGODB_URI` set correctly
- Ensure MongoDB is running and accessible

### Script shows "users not found"
- The user IDs in the API response might be different from database IDs
- Run `check-real-users.js` to see all users and their IDs

### Fixes don't seem to work
- Check the server logs for API calls
- Verify the Next.js dev server is running
- Check MongoDB connection is correct

## Next Steps

After running the fix scripts:
1. Refresh the leaderboard page
2. Check server logs for API calls
3. Verify data is being saved correctly when users stake/submit
4. Monitor the leaderboard to ensure it updates correctly

