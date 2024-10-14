const DECIMAL = 8;
const INITIAL_ANSWER = 300000000000;

const devlopmentChains = ["hardhat", "local"];

const LOCK_TIME = 180;

const CONFIRMATIONS = 6;

const networkConfig = {
	// chainId: "",
	11155111: {
		name: "sepolia",
		ethUsdDataFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
	},
	// priceFeed: "",
};

module.exports = {
	DECIMAL,
	INITIAL_ANSWER,
	devlopmentChains,
	networkConfig,
	LOCK_TIME,
	CONFIRMATIONS,
};
