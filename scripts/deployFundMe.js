/*
    This script deploys the FundMe contract to the blockchain.
    // import ethers.js
    // create main function
        init 2 accounts
        fundd contract with first account
        check balance of contract
        fund contract with second account
        check balance of contract
        check mapping fundersToAmount
    // execute main function

*/

const { ethers } = require("hardhat");

// async:异步函数（非同步），与await 一起使用，效果就是等一条语句执行完再执行下一句
async function main() {
	// create fatory
	// 下面语句添加了一个await，意思是等待合约部署完成再继续执行下一行语句（这一步操作没有执行完成之前，不能执行下一步操作）
	const fundMeFactory = await ethers.getContractFactory("FundMe");
	console.log("contract is being deployed...");

	//   deploy contract from factory--只是发送deploy操作，并不能保证deploy已经完成
	const fundMe = await fundMeFactory.deploy(300); //300是秒
	await fundMe.waitForDeployment();
	//   两种写法--都能正常运行
	console.log("合约部署成功, contratct address is :" + fundMe.target);
	// console.log(
	//   `contract has been deployed successfully, contratct address is ${fundMe.target}`
	// );

	//verify fundMe
	// 如果合约是部署到本地测试网络，跳过以下验证逻辑。只有部署到测试网，才考虑以下verify步骤。(添加了唯一标识chainid区分是本地测试网络还是测试网)
	if (hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
		// 等待6个区块确认,确认完之后才会执行下一步操作
		console.log("waiting for 6 blocks confirmations...");
		await fundMe.deploymentTransaction.wait(6);
		await verifyFundMe(fundMe.target, [300]);
	} else {
		console.log("verification skipped...");
	}

	// init 2 accounts
	const [firstAccount, secondAccount] = await ethers.getSigners();

	// fundd contract with first account
	//fundMe.fund 只能保证调用合约里面这个fund函数的这个交易发送成功了，但不能保证这个交易已经写入区块链了，同上面的deploy()
	const fundTx = await fundMe.fund({ value: ethers.parseEther("0.1") });
	await fundTx.wait();

	// check balance of contract
	const balanceOfContract = await ethers.provider.getBalance(fundMe.target);
	console.log(`Balance of the contract is ${balanceOfContract}`);

	// fund contract with second account
	// .connect(secondAccount),如果不指定账号，系统会默认使用第一个账号firstAccount
	const fundTxWithSecondAccount = await fundMe.connect(secondAccount).fund({
		value: ethers.parseEther("0.1"),
	});
	await fundTxWithSecondAccount.wait();

	// check balance of contract
	const balanceOfContractAfterSecondFund = await ethers.provider.getBalance(
		fundMe.target
	);
	console.log(`Balance of the contract is ${balanceOfContractAfterSecondFund}`);

	// check mapping fundersToAmount
	const firstAccountBalanceInFundMe = await fundMe.fundersToAmount(
		firstAccount.address
	);
	const secondAccountBalanceInFundMe = await fundMe.fundersToAmount(
		secondAccount.address
	);
	console.log(
		`Balance of first account ${firstAccount.address} is ${firstAccountBalanceInFundMe}`
	);
	console.log(
		`Balance of second account ${seccondAccount.address} is ${secondAccountBalanceInFundMe}`
	);
}
async function verifyFundMe(fundMeAddr, args) {
	// 验证合约--一次性写入自动验证
	await hre.run("verify:verify", {
		address: fundMeAddr, // 合约地址
		constructorArguments: args, // 合约构造函数的参数
	});
}

main()
	.then()
	.catch((error) => {
		console.error(error);
		process.exit(0);
	});
