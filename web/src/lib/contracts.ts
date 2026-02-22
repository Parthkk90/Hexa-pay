import { Contract, BrowserProvider, Wallet, HDNodeWallet, JsonRpcProvider, Signer } from "ethers";
import { CREDIT_MANAGER_ADDRESS, MOCK_USDC_ADDRESS } from "../config/contracts";
import { MONAD_TESTNET } from "../config/chains";

const creditManagerAbi = [
  "function stakeCollateral(uint256 amount)",
  "function executePayment(address borrower, uint256 amount)",
  "function getCredit(address wallet) view returns (uint256 collateralAmount, uint256 creditLimit, uint256 amountBorrowed, uint256 availableCredit, uint256 score, bool isActive, uint256 lastRepaymentTime)",
  "event PaymentExecuted(address indexed borrower, uint256 amount, uint256 totalBorrowed)"
];

const usdcAbi = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)"
];

export type CreditSnapshot = {
  collateralAmount: bigint;
  creditLimit: bigint;
  amountBorrowed: bigint;
  availableCredit: bigint;
  score: bigint;
  isActive: boolean;
  lastRepaymentTime: bigint;
};

export async function getCreditManager(provider: BrowserProvider): Promise<Contract> {
  const signer = await provider.getSigner();
  return new Contract(CREDIT_MANAGER_ADDRESS, creditManagerAbi, signer);
}

// For embedded wallet or any signer
export function getCreditManagerWithWallet(signer: Wallet | HDNodeWallet | Signer): Contract {
  return new Contract(CREDIT_MANAGER_ADDRESS, creditManagerAbi, signer);
}

export async function getUsdc(provider: BrowserProvider): Promise<Contract> {
  const signer = await provider.getSigner();
  return new Contract(MOCK_USDC_ADDRESS, usdcAbi, signer);
}

export async function getCredit(provider: BrowserProvider, wallet: string): Promise<CreditSnapshot> {
  const contract = await getCreditManager(provider);
  const credit = await contract.getCredit(wallet);

  return {
    collateralAmount: credit.collateralAmount as bigint,
    creditLimit: credit.creditLimit as bigint,
    amountBorrowed: credit.amountBorrowed as bigint,
    availableCredit: credit.availableCredit as bigint,
    score: credit.score as bigint,
    isActive: credit.isActive as boolean,
    lastRepaymentTime: credit.lastRepaymentTime as bigint
  };
}

// Read-only credit check (no wallet needed)
export async function getCreditReadOnly(walletAddress: string): Promise<CreditSnapshot> {
  const provider = new JsonRpcProvider(MONAD_TESTNET.rpc);
  const contract = new Contract(CREDIT_MANAGER_ADDRESS, creditManagerAbi, provider);
  const credit = await contract.getCredit(walletAddress);

  return {
    collateralAmount: credit.collateralAmount as bigint,
    creditLimit: credit.creditLimit as bigint,
    amountBorrowed: credit.amountBorrowed as bigint,
    availableCredit: credit.availableCredit as bigint,
    score: credit.score as bigint,
    isActive: credit.isActive as boolean,
    lastRepaymentTime: credit.lastRepaymentTime as bigint
  };
}
