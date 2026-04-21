import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment on Monad Testnet...");
  
  // Get the Contract Factory
  const SelorahIdentity = await ethers.getContractFactory("SelorahIdentity");
  
  // Deploy the Contract
  console.log("Deploying SelorahIdentity contract...");
  const contract = await SelorahIdentity.deploy();
  
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log(`\n✅ Success! SelorahIdentity deployed to: ${address}`);
  console.log("Please save this address. You will need to add it to your frontend and backend .env files.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
