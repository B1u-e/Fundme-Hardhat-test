/*
// 常规写法
function deployFunction() {
  console.log("this is a deploy function");
}
 module.exports = deployFunction;
*/

const { network } = require("hardhat");
const {
	devlopmentChains,
	networkConfig,
	LOCK_TIME,
	CONFIRMATIONS,
} = require("../helper-hardhat-config");

/*
// 简写
module.exports = async (hre) => {
// 经常使用到的两个函数
  const getNamedAccounts = hre.getNamedAccounts;
  const deployments = hre.deployments;
  console.log("this is a deploy function");
};
*/

// 再简写
module.exports = async ({ getNamedAccounts, deployments }) => {
	/*
	// 第一种写法
	 const firstAccount = (await getNamedAccounts()).firstAccount;
   const deploy = deployments.deploy;
  */
	// 简写
	const { firstAccount } = await getNamedAccounts();
	const { deploy } = deployments;

	let dataFeedAddr;
	let confirmations;
	if (devlopmentChains.includes(network.name)) {
		const mockV3Aggregator = await deployments.get("MockV3Aggregator");
		dataFeedAddr = mockV3Aggregator.address;
		confirmations = 0; //在测试网部署时 等待的区块数，本地部署不需要等待
	} else {
		dataFeedAddr = networkConfig[network.config.chainId].ethUsdDataFeed;
		confirmations = CONFIRMATIONS;
	}

	// 部署合约
	const fundMe = await deploy("FundMe", {
		from: firstAccount,
		args: [LOCK_TIME, dataFeedAddr],
		log: true,
		waitConfirmations: confirmations,
	});

	// remove development directory or add --reset flag if you want to  redeploy contract

	if (hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
		await hre.run("verify:verify", {
			address: fundMe.address,
			constructorArguments: [LOCK_TIME, dataFeedAddr],
		});
	} else {
		console.log("network is not sepolia, verification skipped");
	}
};

module.exports.tags = ["all", "fundme"];
/*
// 运行脚本,将会部署所有tags为all的合约
 npx hardhat deploy --tags all 
*/
