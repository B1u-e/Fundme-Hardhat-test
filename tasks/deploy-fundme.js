//终端输入npx hardhat help可以查看harhat打包好的所有task
// 以下是尝试书写一个task
// 使用方法： npx hardhat deploy-fundme --network sepolia

const { task } = require("hardhat/config");

task("deploy-fundme", "deploy and verify fundme").setAction(
	async (taskArgs, hre) => {
		// create fatory
		// 下面语句添加了一个await，意思是等待合约部署完成再继续执行下一行语句（这一步操作没有执行完成之前，不能执行下一步操作）
		const fundMeFactory = await ethers.getContractFactory("FundMe");
		console.log("contract is being deployed...");

		//   deploy contract from factory--只是发送deploy操作，并不能保证deploy已经完成
		const fundMe = await fundMeFactory.deploy(300); //300是秒
		await fundMe.waitForDeployment();
		//   两种写法--都能正常运行
		//   console.log("合约部署成功, contratct address is :" + fundMe.target);
		console.log(
			`contract has been deployed successfully, contratct address is ${fundMe.target}`
		);

		//verify fundMe
		// 如果合约是部署到本地测试网络，跳过以下验证逻辑。只有部署到测试网，才考虑以下verify步骤。(添加了唯一标识chainid区分是本地测试网络还是测试网)
		if (
			hre.network.config.chainId == 11155111 &&
			process.env.ETHERSCAN_API_KEY
		) {
			// 等待6个区块确认,确认完之后才会执行下一步操作
			console.log("waiting for 6 blocks confirmations...");
			await fundMe.deploymentTransaction.wait(6);
			await verifyFundMe(fundMe.target, [300]);
		} else {
			console.log("verification skipped...");
		}
	}
);
async function verifyFundMe(fundMeAddr, args) {
	// 验证合约--一次性写入自动验证
	await hre.run("verify:verify", {
		address: fundMeAddr, // 合约地址
		constructorArguments: args, // 合约构造函数的参数
	});
}

module.exports = {};
