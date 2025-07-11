const { ethers } = require("hardhat");

async function main() {
  const [deployer, warden] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Warden account:", warden.address);

  const CollegeBreakfast = await ethers.getContractFactory("CollegeBreakfast");
  const collegeBreakfast = await CollegeBreakfast.deploy(warden.address);

  await collegeBreakfast.waitForDeployment();

  console.log("CollegeBreakfast deployed to:", await collegeBreakfast.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
