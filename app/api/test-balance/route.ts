import { NextRequest, NextResponse } from "next/server";
import { getComprehensiveBalance } from "@/lib/balance";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address") || "0xca10b0176c34f9a8315589ff977645e04497814e9753d21f7d7e7c3d83aa7b57";
    const TOKEN_ADDRESS = "0xf773bc6eebd44641bf05de104de29d1a824f24bdecbdaaf5279a18a13e8987de";
    
    console.log("Testing balance for address:", address);
    
    const walletBalance = await getComprehensiveBalance(address, "testnet");
    
    // Find TSKULL token
    const tskullToken = walletBalance.tokens.find(
      (token) => 
        token.tokenType === TOKEN_ADDRESS || 
        token.tokenType.includes(TOKEN_ADDRESS) ||
        token.symbol === "TSKULL"
    );

    if (tskullToken) {
      return NextResponse.json({
        success: true,
        found: true,
        balance: tskullToken.formattedAmount,
        rawBalance: tskullToken.amount,
        symbol: tskullToken.symbol,
        name: tskullToken.name,
        decimals: tskullToken.decimals,
        tokenType: tskullToken.tokenType,
        allTokens: walletBalance.tokens.map(t => ({
          symbol: t.symbol,
          tokenType: t.tokenType,
          amount: t.formattedAmount,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      found: false,
      balance: "0",
      rawBalance: "0",
      note: "TSKULL token not found in wallet",
      allTokens: walletBalance.tokens.map(t => ({
        symbol: t.symbol,
        tokenType: t.tokenType,
        amount: t.formattedAmount,
      })),
      tokenCount: walletBalance.tokenCount,
    });
  } catch (error: any) {
    console.error("Balance test error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

