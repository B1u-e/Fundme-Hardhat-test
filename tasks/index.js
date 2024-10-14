// tasks多的情况下，可以单独建立一个文件把所有tasks集合到一起并导出，这时仅需在hardhat.config.js中引入即可
exports.deployContract = require("./deploy-fundme");
exports.interactContract = require("./interact-fundme");
