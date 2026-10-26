import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment on Monad Testnet...");

  const SelorahIdentity = await ethers.getContractFactory("SelorahIdentity");
  console.log("Deploying SelorahIdentity contract...");
  const identity = await SelorahIdentity.deploy();
  await identity.waitForDeployment();
  const identityAddress = await identity.getAddress();
  console.log(`SelorahIdentity deployed to: ${identityAddress}`);

  const SelorahAccessControl = await ethers.getContractFactory("SelorahAccessControl");
  console.log("Deploying SelorahAccessControl contract...");
  const accessControl = await SelorahAccessControl.deploy();
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log(`SelorahAccessControl deployed to: ${accessControlAddress}`);

  console.log("\nSuccess. Save these addresses in the frontend and backend env files.");
  console.log(`VITE_SELORAH_IDENTITY_ADDRESS=${identityAddress}`);
  console.log(`VITE_SELORAH_ACCESS_CONTROL_ADDRESS=${accessControlAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
