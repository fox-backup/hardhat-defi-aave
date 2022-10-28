const { getNamedAccounts, ethers } = require("hardhat");

const AMOUNT = ethers.utils.parseEther("0.02");
const PARSE_ETH_AMOUNT = (AMOUNT / 10**18)

async function getWeth() {
    console.log(`--------------------------------------------------`);
    console.log("Connecting to IWeth interface...");
    const { deployer } = await getNamedAccounts();
    // contract address 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
    const iWeth = await ethers.getContractAt("IWeth", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", deployer);
    console.log("Connected!");
    console.log(`Depositing ${PARSE_ETH_AMOUNT.toString()} ETH in the WETH contract...`);
    const tx = await iWeth.deposit({ value: AMOUNT });
    console.log("Transaction sent...");
    await tx.wait(1);
    console.log("Transaction confirmed!");
    console.log("Checking balance...");
    const wethBalance = await iWeth.balanceOf(deployer);
    console.log(`Received ${PARSE_ETH_AMOUNT.toString()} WETH!`);
    console.log(`--------------------------------------------------`);
}

module.exports = { getWeth, AMOUNT };
