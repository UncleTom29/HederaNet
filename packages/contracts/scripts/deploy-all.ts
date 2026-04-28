import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.info(`Deploying all contracts with: ${deployer.address}`);

  const EnergyMarket = await ethers.getContractFactory("EnergyMarket");
  const energyMarket = await EnergyMarket.deploy(deployer.address);
  await energyMarket.waitForDeployment();
  console.info(`EnergyMarket deployed to: ${await energyMarket.getAddress()}`);

  const MeshSubscription = await ethers.getContractFactory("MeshSubscription");
  const meshSubscription = await MeshSubscription.deploy(deployer.address);
  await meshSubscription.waitForDeployment();
  console.info(`MeshSubscription deployed to: ${await meshSubscription.getAddress()}`);

  const OperatorStaking = await ethers.getContractFactory("OperatorStaking");
  const operatorStaking = await OperatorStaking.deploy(deployer.address);
  await operatorStaking.waitForDeployment();
  console.info(`OperatorStaking deployed to: ${await operatorStaking.getAddress()}`);

  const HederaNetOracle = await ethers.getContractFactory("HederaNetOracle");
  const hederaNetOracle = await HederaNetOracle.deploy(deployer.address);
  await hederaNetOracle.waitForDeployment();
  console.info(`HederaNetOracle deployed to: ${await hederaNetOracle.getAddress()}`);

  console.info("\n=== Deployment Summary ===");
  console.info(`Network:          ${(await ethers.provider.getNetwork()).name}`);
  console.info(`EnergyMarket:     ${await energyMarket.getAddress()}`);
  console.info(`MeshSubscription: ${await meshSubscription.getAddress()}`);
  console.info(`OperatorStaking:  ${await operatorStaking.getAddress()}`);
  console.info(`HederaNetOracle:  ${await hederaNetOracle.getAddress()}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
