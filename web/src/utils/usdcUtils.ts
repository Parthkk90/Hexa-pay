export const USDC_DECIMALS = 6;

export const toUSDC = (amount: number): bigint => {
  if (!Number.isFinite(amount) || amount < 0) {
    return 0n;
  }

  const scaled = Math.round(amount * 10 ** USDC_DECIMALS);
  return BigInt(scaled);
};

export const fromUSDC = (amount: bigint): number => {
  return Number(amount) / 10 ** USDC_DECIMALS;
};

export const formatUSDC = (amount: bigint): string => {
  return fromUSDC(amount).toFixed(2);
};
