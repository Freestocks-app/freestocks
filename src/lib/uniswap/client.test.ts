import { describe, it, expect } from "vitest";
import { Interface } from "ethers";
import { buildApproveTransaction, buildSwapTransaction, ERC20_ABI } from "./client";
import { UNISWAP_SWAP_ROUTER_02 } from "./constants";

const AAPLC = "0xb200000000000000000000C2e324d24d7eEcd1fb";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const RECIPIENT = "0x1111111111111111111111111111111111111111";

describe("buildApproveTransaction", () => {
  it("builds a transaction targeting the token contract", () => {
    const tx = buildApproveTransaction(AAPLC, "1000000000");
    expect(tx.to).toBe(AAPLC);
  });

  it("encodes an approve() call to SwapRouter02 for the given amount", () => {
    const tx = buildApproveTransaction(AAPLC, "1000000000");
    const iface = new Interface(ERC20_ABI);
    const decoded = iface.decodeFunctionData("approve", tx.data as string);

    // ethers normalizes addresses to EIP-55 checksummed case on decode -
    // compare case-insensitively rather than assuming a specific case.
    expect((decoded[0] as string).toLowerCase()).toBe(UNISWAP_SWAP_ROUTER_02.toLowerCase());
    expect(decoded[1].toString()).toBe("1000000000");
  });
});

describe("buildSwapTransaction", () => {
  it("builds a transaction targeting SwapRouter02", () => {
    const tx = buildSwapTransaction({
      tokenIn: USDC,
      tokenOut: AAPLC,
      fee: 3000,
      recipient: RECIPIENT,
      amountIn: "10000000",
      amountOutMinimum: "37000000",
    });
    expect(tx.to).toBe(UNISWAP_SWAP_ROUTER_02);
  });

  it("encodes exactInputSingle with the exact params passed in", () => {
    const tx = buildSwapTransaction({
      tokenIn: USDC,
      tokenOut: AAPLC,
      fee: 3000,
      recipient: RECIPIENT,
      amountIn: "10000000",
      amountOutMinimum: "37000000",
    });

    const iface = new Interface([
      "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)",
    ]);
    const decoded = iface.decodeFunctionData("exactInputSingle", tx.data as string);
    const params = decoded[0];

    expect(params.tokenIn).toBe(USDC);
    expect(params.tokenOut).toBe(AAPLC);
    expect(params.fee).toBe(BigInt(3000));
    expect(params.recipient).toBe(RECIPIENT);
    expect(params.amountIn.toString()).toBe("10000000");
    expect(params.amountOutMinimum.toString()).toBe("37000000");
    expect(params.sqrtPriceLimitX96).toBe(BigInt(0));
  });
});
