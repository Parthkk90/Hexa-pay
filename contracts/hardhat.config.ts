import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const MONAD_RPC_URL = process.env.MONAD_RPC_URL || "";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";
const DEPLOYER_MNEMONIC = process.env.DEPLOYER_MNEMONIC || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    monadTestnet: {
      url: MONAD_RPC_URL,
      chainId: 10143,
      accounts: DEPLOYER_PRIVATE_KEY 
        ? [DEPLOYER_PRIVATE_KEY]
        : DEPLOYER_MNEMONIC
        ? { mnemonic: DEPLOYER_MNEMONIC, path: "m/44'/60'/0'/0", initialIndex: 0, count: 1 }
        : []
    }
  }
};

export default config;
