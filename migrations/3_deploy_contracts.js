var Subscriptions = artifacts.require("./Subscriptions.sol");

module.exports = function(deployer) {
  deployer.deploy(Subscriptions);
};
