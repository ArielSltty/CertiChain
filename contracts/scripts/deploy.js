const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying CertificateNFT contract...");
  console.log("==========================================");

  // Get the contract factory
  const CertificateNFT = await hre.ethers.getContractFactory("CertificateNFT");
  
  // Deploy the contract
  const certificateNFT = await CertificateNFT.deploy();

  // Wait for deployment
  await certificateNFT.waitForDeployment();

  // Get contract address
  const contractAddress = await certificateNFT.getAddress();
  
  console.log("✅ CertificateNFT deployed successfully!");
  console.log("==========================================");
  console.log(`📋 Contract Address: ${contractAddress}`);
  console.log(`👤 Owner: ${await certificateNFT.owner()}`);
  console.log(`🔗 Explorer: https://sepolia.etherscan.io/address/${contractAddress}`);
  console.log("==========================================");
  
  // Verify contract on Etherscan (optional - uncomment if you want auto-verify)
  // console.log("⏳ Waiting for block confirmations...");
  // await certificateNFT.deploymentTransaction().wait(5);
  // 
  // console.log("🔍 Verifying contract on Etherscan...");
  // await hre.run("verify:verify", {
  //   address: contractAddress,
  //   constructorArguments: [],
  // });
  // console.log("✅ Contract verified!");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });