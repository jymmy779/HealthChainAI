const hre = require("hardhat");

async function main() {
  console.log("Deploying HealthRecordRegistry contract...");

  const HealthRecordRegistry = await hre.ethers.getContractFactory("HealthRecordRegistry");
  const registry = await HealthRecordRegistry.deploy();

  await registry.waitForDeployment();

  console.log("HealthRecordRegistry deployed to:", await registry.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
