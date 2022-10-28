const { getNamedAccounts, ethers } = require('hardhat');
const { getWeth, AMOUNT } = require('../scripts/getWeth');

async function main() {
    await getWeth();
    const { deployer } = await getNamedAccounts();
    const lendingPool = await getLendingPool(deployer);
    console.log(`LendingPool Address is ${lendingPool.address}`);
    console.log(typeof lendingPool);

    // Approve
    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer);

    //Deposit
    console.log(`Depositing...`);
    await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0);
    console.log(`Deposited WETH into the aave lending pool!`);

    // Borrow
    let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(lendingPool, deployer);
    const daiPrice = await getDaiPrice();
    const amountDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber());
    console.log(`\tYou can borrow ${amountDaiToBorrow} DAI.`);
    const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString());
    const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    await borrowDai(daiTokenAddress, lendingPool, amountDaiToBorrowWei, deployer);
    await getBorrowUserData(lendingPool, deployer);
    await repay(amountDaiToBorrowWei, daiTokenAddress, lendingPool, deployer)
    await getBorrowUserData(lendingPool, deployer);
}

async function repay(amount, daiAddress, lendingPool, account) {
    await approveErc20(daiAddress, lendingPool.address, amount, account);
    const repayTx =  await lendingPool.repay(daiAddress, 1, amount);
    await repayTx.wait(1);
    console.log(`Repayed!`)
}

async function borrowDai(daiAddress, lendingPool, amountDaiToBorrowWei, account) {
    const borrowTx = await lendingPool.borrow(daiAddress, amountDaiToBorrowWei, 1, 0, account);
    await borrowTx.wait(1);
    console.log(`\tYou have borrowed ${amountDaiToBorrowWei / 10**18} DAI!`);
}

async function getDaiPrice() {
    const daiEthPriceFeed = await ethers.getContractAt("AggregatorV3Interface","0x773616E4d11A78F511299002da57A0a94577F1f4");
    const price = (await daiEthPriceFeed.latestRoundData())[1];
    console.log(`\tThe DAI/ETH price is ${price.toString()}`);
    return price
}

async function getBorrowUserData(lendingPool, account) {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } = await lendingPool.getUserAccountData(account);
    console.log(`\tYou have ${totalCollateralETH / 10**18} worth of ETH deposited.`);
    console.log(`\tYou have ${totalDebtETH / 10**18} worth of ETH borrowed.`);
    console.log(`\tYou have ${availableBorrowsETH / 10**18} worth of ETH avaiable to borrow.`);
    return { totalDebtETH, availableBorrowsETH }
}

async function getLendingPool(account) {
    const lendingPoolAddressProvider = await ethers.getContractAt("ILendingPoolAddressesProvider", "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5", account);
    const lendingPoolAdrress = await lendingPoolAddressProvider.getLendingPool();
    const lendingPool = await ethers.getContractAt("ILendingPool" ,lendingPoolAdrress, account);
    return lendingPool
}

async function approveErc20(erc20Address, spenderAddress, amountToSpend, account) {
    const erc20Token = await ethers.getContractAt("IERC20", erc20Address, account);
    const tx = await erc20Token.approve(spenderAddress, amountToSpend);
    await tx.wait(1);
    console.log(`Approved ERC20 Token at Address ${erc20Address}`);
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.log(e);
        process.exit(1);
    });
