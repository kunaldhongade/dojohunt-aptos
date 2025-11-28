# DojoHunt 🎯

> A modern, full-stack coding challenge platform that combines competitive programming with blockchain technology.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-green)](https://www.mongodb.com/)
[![Aptos](https://img.shields.io/badge/Aptos-Blockchain-000000)](https://aptoslabs.com/)

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Key Features](#key-features)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

DojoHunt is a comprehensive coding challenge platform that allows developers to:

- Solve coding challenges in JavaScript using a Monaco editor
- Stake ETH tokens to unlock challenges
- Compete on leaderboards and earn achievements
- Track progress and statistics

The platform features real-time code execution, blockchain integration, and a gamified learning experience.

## ✨ Features

### 🧩 Coding Challenges

- **Monaco Editor**: Professional code editor with syntax highlighting and IntelliSense
- **Real-time Execution**: Run and test code instantly against test cases
- **Multiple Difficulties**: Easy, Medium, and Hard challenges
- **Test Case Validation**: Variables-based test cases with flexible input handling
- **Challenge Filtering**: Search and filter by difficulty, category, and keywords

### 🏆 Gamification

- **Leaderboard System**: Real-time rankings with multiple sorting options
- **Achievement System**: Automatic achievement tracking for milestones
- **Tier System**: Bronze, Silver, Gold, Platinum, and Diamond tiers
- **User Statistics**: Track challenges completed, scores, streaks, and staking history

### ⛓️ Blockchain Integration

- **Aptos Staking**: Stake tokens to unlock challenges
- **Smart Contract Integration**: Move smart contracts on Aptos blockchain
- **Transaction Verification**: Secure blockchain transaction verification
- **Fee System**: Fee-free unstaking upon challenge completion

### 🎨 Modern UI/UX

- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark Theme**: Full dark mode support
- **Real-time Updates**: Live leaderboard and progress tracking
- **Intuitive Navigation**: Clean, modern interface

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Monaco Editor** - VS Code editor integration
- **Radix UI** - Accessible component primitives
- **NextAuth.js** - Authentication system

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - NoSQL database (native driver)
- **NextAuth.js** - Authentication with multiple providers
- **Zod** - Schema validation
- **Bcrypt** - Password hashing

### Blockchain

- **Aptos TypeScript SDK** - Aptos blockchain interaction
- **Move Smart Contracts** - Custom staking and token contracts
- **Aptos** - Blockchain for smart contract operations

### Code Execution

- **Node.js** - JavaScript runtime
- **Docker** - Optional sandboxed execution
- **Security Validation** - Blacklist-based security checks

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18 or higher
- **PNPM** (or npm/yarn)
- **MongoDB** (local or cloud instance)
- **Docker** (optional, for code execution)
- **Git** - Version control

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd DojoHunt
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
# Or create .env.local manually
```

### 4. Configure Environment Variables

See [Configuration](#configuration) section for detailed environment variable setup.

### 5. Setup Database

```bash
pnpm run db:setup
```

### 6. Seed Database (Optional)

```bash
pnpm run db:seed
```

## ⚙️ Configuration

### Required Environment Variables

Create a `.env.local` file with the following variables:

```env
# MongoDB
MONGODB_URI="mongodb://localhost:27017/dojohunt"
MONGODB_DB="dojohunt"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# JWT
JWT_SECRET="your-jwt-secret-here"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth (Optional)
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# Aptos Blockchain
NEXT_PUBLIC_APTOS_NETWORK="testnet"
NEXT_PUBLIC_STAKING_MODULE_ADDRESS="0x..."
NEXT_PUBLIC_TOKEN_MODULE_ADDRESS="0x..."

# Code Execution
USE_DOCKER_EXECUTOR=true

# Development
NODE_ENV="development"
```

### Environment Variable Descriptions

#### MongoDB

- `MONGODB_URI`: MongoDB connection string (local or cloud)
- `MONGODB_DB`: Database name

#### Authentication

- `NEXTAUTH_URL`: Application URL (e.g., `http://localhost:3000`)
- `NEXTAUTH_SECRET`: NextAuth secret key (generate with `openssl rand -base64 32`)
- `JWT_SECRET`: JWT secret key for token signing
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `GITHUB_ID` / `GITHUB_SECRET`: GitHub OAuth credentials

#### Aptos Blockchain

- `NEXT_PUBLIC_APTOS_NETWORK`: Aptos network (`testnet` or `mainnet`)
- `NEXT_PUBLIC_STAKING_MODULE_ADDRESS`: Staking module address on Aptos
- `NEXT_PUBLIC_TOKEN_MODULE_ADDRESS`: Token module address on Aptos

#### Code Execution

- `USE_DOCKER_EXECUTOR`: Enable Docker execution (`true`/`false`)

## 🏃 Running the Project

### Development Mode

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Production Build

```bash
pnpm build
pnpm start
```

### Docker Setup (Optional)

If you want to use Docker for code execution:

```bash
docker-compose up -d
```

## 📁 Project Structure

```
DojoHunt/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin panel
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── challenges/   # Challenge endpoints
│   │   ├── leaderboard/  # Leaderboard endpoint
│   │   └── staking/      # Staking endpoints
│   ├── auth/             # Authentication pages
│   ├── challenges/       # Challenge pages
│   ├── dashboard/        # User dashboard
│   ├── leaderboard/      # Leaderboard page
│   └── staking/          # Staking page
├── components/            # React components
│   ├── admin/           # Admin components
│   ├── ui/              # UI components
│   └── *.tsx            # Shared components
├── lib/                  # Utility libraries
│   ├── models/          # TypeScript interfaces
│   ├── mongodb.ts       # MongoDB connection
│   ├── code-executor.ts # Code execution logic
│   ├── blockchain.ts    # Blockchain utilities
│   └── auth-utils.ts    # Authentication utilities
├── contracts/            # Smart contracts
│   ├── contracts/       # Solidity contracts
│   └── scripts/         # Deployment scripts
├── docker/              # Docker configuration
├── scripts/             # Setup scripts
└── .cursor/docs/        # Documentation
```

## 📜 Available Scripts

### Development

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

### Database

```bash
pnpm run db:setup     # Setup database collections and indexes
pnpm run db:seed      # Seed database with sample data
pnpm run db:reset     # Reset database
```

### Setup

```bash
pnpm run setup        # Run setup script (creates .env and sets up database)
pnpm run quick-setup  # Quick setup script
```

## 🎯 Key Features

### Code Execution

The platform supports two execution modes:

1. **Run Code**: Execute code against a single test case (for testing)
2. **Submit Solution**: Execute code against all test cases (for evaluation)

Code execution includes:

- Security validation (blacklist-based)
- Timeout protection (5 seconds per test case)
- Docker isolation (optional)
- Test case validation

### Authentication

Supports multiple authentication methods:

- **Credentials**: Email/password authentication
- **Google OAuth**: Sign in with Google
- **GitHub OAuth**: Sign in with GitHub
- **Wallet**: Wallet authentication (infrastructure exists)

### Staking System

1. User stakes tokens on blockchain
2. User submits transaction hash to backend
3. Backend verifies transaction
4. Backend assigns 5 random challenges
5. User completes challenges
6. Stake completion tracked in database

### Challenge System

- **Admin Panel**: Create and manage challenges
- **Challenge Browsing**: Browse, search, and filter challenges
- **Challenge Solving**: Solve challenges in Monaco editor
- **Test Cases**: Variables-based test cases with flexible input handling

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth handler
- `POST /api/auth/wallet` - Wallet authentication

### Challenge Endpoints

- `GET /api/challenges` - Get list of challenges
- `GET /api/challenges/[id]` - Get challenge details
- `POST /api/challenges` - Create challenge (admin)
- `POST /api/challenges/[id]/run` - Run code against test case
- `POST /api/challenges/[id]/submit` - Submit solution

### Staking Endpoints

- `POST /api/staking/stake` - Create stake
- `GET /api/staking/stake` - Get current stake

### Leaderboard Endpoints

- `GET /api/leaderboard` - Get leaderboard data

For detailed API documentation, see [`.cursor/docs/08_API_REFERENCE.md`](.cursor/docs/08_API_REFERENCE.md).

## 🚀 Deployment

### Vercel Deployment

1. **Push to GitHub**: Push your code to GitHub
2. **Import to Vercel**: Import your repository to Vercel
3. **Configure Environment Variables**: Add all environment variables in Vercel dashboard
4. **Set Docker Executor**: Set `USE_DOCKER_EXECUTOR=false` for Vercel (Docker not supported)
5. **Deploy**: Deploy your application

**Note**: Vercel doesn't support Docker in serverless functions. Use `USE_DOCKER_EXECUTOR=false` for Vercel deployment.

For detailed deployment instructions, see [`.cursor/docs/10_VERCEL_DEPLOYMENT.md`](.cursor/docs/10_VERCEL_DEPLOYMENT.md).

### Alternative Deployment Options

- **Railway**: Full Docker support available
- **Render**: Full Docker support available
- **Self-Hosted**: Full control with Docker support

## 📖 Documentation

Comprehensive documentation is available in the [`.cursor/docs/`](.cursor/docs/) directory:

- [**00_PROJECT_UNDERSTANDING.md**](.cursor/docs/00_PROJECT_UNDERSTANDING.md) - Complete project understanding
- [**01_PROJECT_OVERVIEW.md**](.cursor/docs/01_PROJECT_OVERVIEW.md) - Project overview
- [**02_FRONTEND.md**](.cursor/docs/02_FRONTEND.md) - Frontend documentation
- [**03_BACKEND_API.md**](.cursor/docs/03_BACKEND_API.md) - Backend API documentation
- [**04_DATABASE_SCHEMA.md**](.cursor/docs/04_DATABASE_SCHEMA.md) - Database schema
- [**05_BLOCKCHAIN.md**](.cursor/docs/05_BLOCKCHAIN.md) - Blockchain integration
- [**06_CODE_EXECUTION.md**](.cursor/docs/06_CODE_EXECUTION.md) - Code execution system
- [**07_SETUP_DEPLOYMENT.md**](.cursor/docs/07_SETUP_DEPLOYMENT.md) - Setup and deployment
- [**08_API_REFERENCE.md**](.cursor/docs/08_API_REFERENCE.md) - API reference
- [**09_QUICK_REFERENCE.md**](.cursor/docs/09_QUICK_REFERENCE.md) - Quick reference
- [**10_VERCEL_DEPLOYMENT.md**](.cursor/docs/10_VERCEL_DEPLOYMENT.md) - Vercel deployment
- [**11_CODE_EXECUTION_FLOW.md**](.cursor/docs/11_CODE_EXECUTION_FLOW.md) - Code execution flow

## 🧪 Testing

### Running Tests

```bash
# Run tests (when implemented)
pnpm test
```

### Code Execution Testing

1. Navigate to a challenge page
2. Write code in Monaco editor
3. Click "Run" to test against a single test case
4. Click "Submit Solution" to submit for evaluation

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the Repository**: Fork the repository on GitHub
2. **Create a Branch**: Create a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make Changes**: Make your changes and commit them (`git commit -m 'Add some amazing feature'`)
4. **Push to Branch**: Push to your branch (`git push origin feature/amazing-feature`)
5. **Open Pull Request**: Open a pull request on GitHub

### Development Guidelines

- Follow TypeScript best practices
- Use Zod for input validation
- Write comprehensive error handling
- Update documentation for new features
- Follow the existing code style

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Error

```bash
# Check if MongoDB is running
mongosh

# Check connection string in .env.local
MONGODB_URI="mongodb://localhost:27017/dojohunt"
```

#### NextAuth Session Issues

```bash
# Generate a new secret
openssl rand -base64 32

# Update NEXTAUTH_SECRET in .env.local
```

#### Docker Execution Issues

```bash
# Check if Docker is running
docker ps

# Disable Docker execution if not available
USE_DOCKER_EXECUTOR=false
```

#### Blockchain Connection Issues

```bash
# Check RPC URL in .env.local
NEXT_PUBLIC_APTOS_NETWORK="testnet"
NEXT_PUBLIC_STAKING_MODULE_ADDRESS="0x..."
NEXT_PUBLIC_TOKEN_MODULE_ADDRESS="0x..."

# Verify contract addresses
NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS="0x..."
NEXT_PUBLIC_STAKING_TOKEN_ADDRESS="0x..."
```

For more troubleshooting help, see [`.cursor/docs/07_SETUP_DEPLOYMENT.md`](.cursor/docs/07_SETUP_DEPLOYMENT.md).

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** - React framework
- **MongoDB** - Database
- **Aptos TypeScript SDK** - Blockchain interaction
- **Monaco Editor** - Code editor
- **Radix UI** - UI components
- **NextAuth.js** - Authentication

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ by the DojoHunt Team**
