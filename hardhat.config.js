require("@nomicfoundation/hardhat-toolbox");
require("@chainlink/env-enc").config();
// require("./tasks/deploy-fundme");
require("./tasks");
require("hardhat-deploy");
require("@nomicfoundation/hardhat-ethers");
require("hardhat-deploy-ethers");

const SEPOLIA_URL = process.env.SEPOLIA_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PRIVATE_KEY_1 = process.env.PRIVATE_KEY_1;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: "0.8.24",
	defaultNetwork: "hardhat",
	mocha: {
		// mocha测试脚本里面默认值限制40秒，超过40秒就是超时了
		timeout: 300000, // 300s
	},
	networks: {
		sepolia: {
			url: SEPOLIA_URL,
			accounts: [PRIVATE_KEY, PRIVATE_KEY_1],
			chainId: 11155111,
		},
	},
	etherscan: {
		apiKey: {
			sepolia: ETHERSCAN_API_KEY,
		},
	},
	namedAccounts: {
		firstAccount: {
			default: 0,
		},
		secondAccount: {
			default: 1,
		},
	},
	gasReporter: {
		enabled: true,
	},
};
