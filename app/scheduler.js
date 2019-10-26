// This is a simple scheduler, that will trigger autimatically subscription payments/ 
//
const Web3 = require('web3')
const EthereumTx = require('ethereumjs-tx')


const KVN_SEED = "need raven outside attitude dwarf agree average canvas wood snack penalty position"
const KVN_URL = "https://kovan.infura.io/v3/5b52483999bb42d6adb222571326568d"
const KVN_ACC = "0x7dB647031EE753604CC3aE49592de4C09818f23b"
const KVN_PROV_ADDR = "0x8D933D915Ae4f74D1b5BA32466c5676F2E15E5A1"
const networkId = 42

const web3 = new Web3(KVN_URL)

const privateKey = new Buffer('9FE7E2041D25411CAC54EB4180FD1855D048F9E3622F149793CDDA43E5ED8FEF', 'hex')
var account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

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

    console.log(`= Found ${count} active subscriptions`);

    for (i = 0; i < count; i++) {
        const providerSubscription = await instance.methods
            .getProviderSubscription(KVN_PROV_ADDR, i)
            .call({from: KVN_PROV_ADDR});

        const id = providerSubscription[0];
        const isCancelled = providerSubscription[7];

        if (isCancelled) {
            continue;
        }

        const amount = await instance.methods
            .getSubscriptionAmount(id)
            .call({from: KVN_PROV_ADDR});

        if (amount > 0) {
            console.log(`= Collecting payment ${ amount } for ${ id }`);

            const myData = await instance.methods
                .executeSubscription(id)
                .encodeABI();
            
            web3.eth.getTransactionCount(KVN_PROV_ADDR, async (err, txCount) => {
                const txObject = {
                    nonce:    web3.utils.toHex(txCount),
                    to:       deployedNetwork.address,
                    value:    web3.utils.toHex(web3.utils.toWei('0', 'ether')),
                    gasLimit: web3.utils.toHex(2100000),
                    gasPrice: web3.utils.toHex(web3.utils.toWei('6', 'gwei')),
                    data: myData  
                }
                // Sign the transaction
                const tx = new EthereumTx(txObject);
                tx.sign(privateKey);
            
                const serializedTx = tx.serialize();
                const raw = '0x' + serializedTx.toString('hex');
            
                // Broadcast the transaction
                const transaction = await web3.eth.sendSignedTransaction(raw, (err, tx) => {
                    console.log(tx)
                });

                console.log(`Success: ${JSON.stringify(transaction.blockHash)}`)
            });
        }
    }
}


setInterval(poll, 30000);