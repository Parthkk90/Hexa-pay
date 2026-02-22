import * as dotenv from "dotenv";
import { ethers } from "hardhat";
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

dotenv.config();

const USDC_DECIMALS = 6;

type DeploymentArtifact = {
  network: string;
  chainId: number;
  deployedAt: string;
  deployer: string;
  transactions: {
    mockUsdcDeployTx: string;
    creditManagerDeployTx: string;
    mintTxHashes: string[];
  };
  mockUsdc: {
    address: string;
    decimals: number;
  };
  creditManager: {
    address: string;
    nfcBridge: string;
  };
};

function validateEnv() {
  const required = [
    "MONAD_RPC_URL",
    "MONAD_CHAIN_ID",
    "NFC_BRIDGE_ADDRESS",
    "DEMO_WALLETS",
    "DEMO_MINT_AMOUNT"
  ];

  const missing = required.filter((key) => !process.env[key] || !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  // Check that either DEPLOYER_PRIVATE_KEY or DEPLOYER_MNEMONIC is provided
  if (!process.env.DEPLOYER_PRIVATE_KEY && !process.env.DEPLOYER_MNEMONIC) {
    throw new Error("Either DEPLOYER_PRIVATE_KEY or DEPLOYER_MNEMONIC must be provided");
  }

  if (Number(process.env.MONAD_CHAIN_ID) !== 10143) {
    throw new Error("MONAD_CHAIN_ID must be 10143 for this deployment flow.");
  }

  const nfcBridge = process.env.NFC_BRIDGE_ADDRESS as string;
  if (!ethers.isAddress(nfcBridge)) {
    throw new Error("NFC_BRIDGE_ADDRESS must be a valid EVM address.");
  }

  const wallets = parseWallets(process.env.DEMO_WALLETS as string);
  if (wallets.length === 0) {
    throw new Error("DEMO_WALLETS must include at least one wallet address.");
  }

  const demoMintAmount = Number(process.env.DEMO_MINT_AMOUNT);
  if (!Number.isFinite(demoMintAmount) || demoMintAmount <= 0) {
    throw new Error("DEMO_MINT_AMOUNT must be a positive number.");
  }
}

function parseWallets(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((wallet) => {
      if (!ethers.isAddress(wallet)) {
        throw new Error(`Invalid wallet in DEMO_WALLETS: ${wallet}`);
      }
      return wallet;
    });
}

function toUSDC(amount: number): bigint {
  const scaled = Math.round(amount * 10 ** USDC_DECIMALS);
  return BigInt(scaled);
}

async function main() {
  validateEnv();

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  const nfcBridge = process.env.NFC_BRIDGE_ADDRESS as string;
  const demoMintAmount = Number(process.env.DEMO_MINT_AMOUNT as string);
  const demoWallets = parseWallets(process.env.DEMO_WALLETS as string);

  console.log("Deploying with:", deployer.address);
  console.log("Network:", network.name, "ChainId:", network.chainId.toString());

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUsdc = await MockUSDC.deploy();
  await mockUsdc.waitForDeployment();

  const mockUsdcAddress = await mockUsdc.getAddress();
  const mockDeployTx = mockUsdc.deploymentTransaction();

  const mintAmountRaw = toUSDC(demoMintAmount);
  const mintTxHashes: string[] = [];

  for (const wallet of demoWallets) {
    const tx = await mockUsdc.mint(wallet, mintAmountRaw);
    const receipt = await tx.wait();
    mintTxHashes.push(receipt?.hash ?? tx.hash);
    console.log(`Minted ${demoMintAmount} mUSDC to ${wallet} | tx: ${tx.hash}`);
  }

  const CreditManager = await ethers.getContractFactory("CreditManager");
  const creditManager = await CreditManager.deploy(mockUsdcAddress, nfcBridge);
  await creditManager.waitForDeployment();

  const creditManagerAddress = await creditManager.getAddress();
  const creditDeployTx = creditManager.deploymentTransaction();

  const artifact: DeploymentArtifact = {
    network: "monadTestnet",
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    transactions: {
      mockUsdcDeployTx: mockDeployTx?.hash ?? "",
      creditManagerDeployTx: creditDeployTx?.hash ?? "",
      mintTxHashes
    },
    mockUsdc: {
      address: mockUsdcAddress,
      decimals: USDC_DECIMALS
    },
    creditManager: {
      address: creditManagerAddress,
      nfcBridge
    }
  };

  const contractsArtifactPath = resolve(__dirname, "..", "deployments", "monad-testnet.json");
  mkdirSync(resolve(__dirname, "..", "deployments"), { recursive: true });
  writeFileSync(contractsArtifactPath, JSON.stringify(artifact, null, 2));

  const webArtifactPath = resolve(__dirname, "..", "..", "web", "src", "generated", "monad-testnet.json");
  mkdirSync(resolve(__dirname, "..", "..", "web", "src", "generated"), { recursive: true });
  writeFileSync(webArtifactPath, JSON.stringify(artifact, null, 2));

  console.log("MockUSDC:", mockUsdcAddress);
  console.log("CreditManager:", creditManagerAddress);
  console.log("MockUSDC deploy tx:", mockDeployTx?.hash ?? "N/A");
  console.log("CreditManager deploy tx:", creditDeployTx?.hash ?? "N/A");
  console.log("Artifacts saved:", contractsArtifactPath, "and", webArtifactPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
