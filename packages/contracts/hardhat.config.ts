import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    hedera_testnet: {
      url: "https://testnet.hashio.io/api",
      accounts: process.env["HEDERA_OPERATOR_PRIVATE_KEY"]
        ? [process.env["HEDERA_OPERATOR_PRIVATE_KEY"]]
        : [],
      chainId: 296,
    },
    hedera_mainnet: {
      url: "https://mainnet.hashio.io/api",
      accounts: process.env["HEDERA_OPERATOR_PRIVATE_KEY"]
        ? [process.env["HEDERA_OPERATOR_PRIVATE_KEY"]]
        : [],
      chainId: 295,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
