const path = require("path");
const HDWalletProvider = require("truffle-hdwallet-provider");

const KVN_SEED = "need raven outside attitude dwarf agree average canvas wood snack penalty position"
const KVN_URL = "https://kovan.infura.io/v3/5b52483999bb42d6adb222571326568d"

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    develop: {
      port: 8545
    },
    kovan: {
      provider: () => new HDWalletProvider(KVN_SEED, KVN_URL),
      network_id: 42,
      gas: 4700000
    }
  }
};
