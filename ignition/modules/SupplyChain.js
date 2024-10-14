const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
module.exports = buildModule("LockModule", (m) => {
  const SupplyChain = m.contract("SupplyChain");

  return { SupplyChain };
});
