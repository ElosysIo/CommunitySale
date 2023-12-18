import { ethers, network, run } from "hardhat";

const main = async () => {
  // Get network name: hardhat, testnet or mainnet.
  const { name } = network;

  console.log("Deploying to network:", network);

  const ElosysCommunitySaleContract = await ethers.getContractFactory("ElosysCommunitySale");
  const ElosysCommunitySale = await ElosysCommunitySaleContract.deploy();
  await ElosysCommunitySale.deployed();
  console.log("ElosysCommunitySale:", ElosysCommunitySale.address);
  
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
