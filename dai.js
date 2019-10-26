const Maker = require('@makerdao/dai');

const YOUR_PRIVATE_KEY = "4346B8171C8385C307DA00CF2BE8A934E69FC26464C23455C9D5B317923EB20A"
const KVN_URL = "https://kovan.infura.io/v3/5b52483999bb42d6adb222571326568d"

async function openLockDraw() {
    const maker = await Maker.create("http", {
        privateKey: YOUR_PRIVATE_KEY,
        url: KVN_URL
    });

  console.log('Maker created');
  await maker.authenticate();

  console.log('Maker authenticated');
  const cdp = await maker.openCdp();

  console.log('CDP created');

  await cdp.lockEth(0.25);

  console.log('PETH created');

  await cdp.drawDai(20);

  console.log('DAI created');

  const debt = await cdp.getDebtValue();
  console.log(debt.toString); // '50.00 DAI'
}

openLockDraw();