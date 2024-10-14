const { devlopmentChains } = require("../helper-hardhat-config");
const { DECIMAL, INITIAL_ANSWER } = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
	//
	if (devlopmentChains.includes(network.name)) {
		const { firstAccount } = await getNamedAccounts();
		const { deploy } = deployments;

		// 部署合约
		await deploy("MockV3Aggregator", {
			from: firstAccount,
			args: [DECIMAL, INITIAL_ANSWER],
			log: true,
		});
	} else {
		console.log("environment is not local, skip deploying mocks");
	}
};

module.exports.tags = ["all", "mock"];
