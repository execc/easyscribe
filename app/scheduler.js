// This is a simple scheduler, that will trigger autimatically subscription payments/ 
//
const Web3 = require('web3')


const KVN_SEED = "need raven outside attitude dwarf agree average canvas wood snack penalty position"
const KVN_URL = "https://kovan.infura.io/v3/5b52483999bb42d6adb222571326568d"
const KVN_ACC = "0x7dB647031EE753604CC3aE49592de4C09818f23b"
const KVN_PROV_ADDR = "0x8D933D915Ae4f74D1b5BA32466c5676F2E15E5A1"
const networkId = 42

const web3 = new Web3(KVN_URL)
const SimpleStorageContract = require('../client/src/contracts/Subscriptions.json');

const deployedNetwork = (SimpleStorageContract.networks)[
    networkId
];

const instance = new web3.eth.Contract(
    SimpleStorageContract.abi,
    deployedNetwork && deployedNetwork.address
);

console.log('=== Subscription collector started ===');
console.log(`= Provider address: ${KVN_PROV_ADDR}`)
console.log(`= Network ID: ${networkId}`)


async function poll() {
    const count = await instance.methods
        .getProviderSubscriptionCount(KVN_PROV_ADDR)
        .call({from: KVN_PROV_ADDR});

    console.log(`= Found ${count} active subscriptiojns`);
}

poll();

