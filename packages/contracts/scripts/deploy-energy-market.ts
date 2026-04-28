import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.info(`Deploying EnergyMarket with: ${deployer.address}`);

  const Factory = await ethers.getContractFactory("EnergyMarket");
  const contract = await Factory.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.info(`EnergyMarket deployed to: ${address}`);
  return address;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
