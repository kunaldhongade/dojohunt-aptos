const fs = require("fs");
const path = require("path");

const envContent = `# MongoDB
MONGODB_URI="mongodb://localhost:27017/dojohunt"
MONGODB_DB="dojohunt"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production-$(date +%s)"

# JWT
JWT_SECRET="your-jwt-secret-here-change-in-production-$(date +%s)"

# Aptos Configuration
NEXT_PUBLIC_APTOS_NETWORK="testnet"
NEXT_PUBLIC_STAKING_MODULE_ADDRESS="0x..."
NEXT_PUBLIC_TOKEN_MODULE_ADDRESS="0x..."

# Email Configuration (optional for development)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Redis (optional for development)
REDIS_URL="redis://localhost:6379"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"

# API Keys (using demo keys for development)
INFURA_API_KEY="demo"
ALCHEMY_API_KEY="demo"

# Security
CORS_ORIGIN="http://localhost:3000"
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"

# Development
NODE_ENV="development"
`;

const envPath = path.join(process.cwd(), ".env.local");

if (fs.existsSync(envPath)) {
  console.log("⚠️  .env.local already exists. Skipping creation.");
  console.log("If you want to recreate it, delete the existing file first.");
} else {
  fs.writeFileSync(envPath, envContent);
  console.log("✅ Created .env.local file");
  console.log(
    "📝 Please update the MongoDB connection string with your credentials"
  );
  console.log("🔑 Make sure to change the secret keys in production!");
}

console.log("\n📋 Next steps:");
console.log("1. Install MongoDB if not already installed");
console.log("2. Start MongoDB service");
console.log("3. Update MONGODB_URI in .env.local if needed");
console.log("4. Run: pnpm db:setup");
console.log("5. Run: pnpm db:seed");
console.log("6. Run: pnpm dev");

console.log("\n🚀 MongoDB Atlas (Cloud) Option:");
console.log("1. Go to https://mongodb.com/atlas");
console.log("2. Create free cluster");
console.log("3. Get connection string");
console.log("4. Update MONGODB_URI in .env.local");
console.log("5. Run setup commands above");
