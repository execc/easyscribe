import Web3 from "web3";
import { AbiItem } from "web3-utils";
import IERC20Contract from "../../contracts/IERC20.json";
import SubscriptionsContract from "../../contracts/Subscriptions.json";
import {
  getServiceNames,
  paymentMethodOptions,
  SubscriptionStatus,
} from "./consts";
import { Subscription } from "./models";

export const getMappedSubscriptions = (
  subscriptions: any[]
): Subscription[] => {
  return subscriptions.map(subscription => {
    const tokenOption = paymentMethodOptions.find(
      option =>
        (option.value as string).toLocaleLowerCase() ===
        subscription[2].toLocaleLowerCase()
    );
    const receiverAddress = subscription[3].toLocaleLowerCase();

    let sellingPrice = subscription[10];
    let restAmount = subscription[11];
    // костыль на продажу
    if (typeof restAmount === "undefined") {
      restAmount = subscription[10];
    }

    return {
      key: subscription[0],
      id: subscription[0],
      token: subscription[2],
      tokenName: tokenOption ? tokenOption.title : undefined,
      tokenImage: tokenOption ? tokenOption.icon : undefined,
      receiverAddress,
      serviceName: getServiceNames(receiverAddress),
      period: subscription[4] / 60,
      amount: subscription[5] / Math.pow(10, 18),
      lastPayment: new Date(Number(subscription[6]) * 1000),
      status: subscription[7]
        ? SubscriptionStatus.INACTIVE
        : SubscriptionStatus.ACTIVE,
      periodCount: subscription[9],
      restAmount: restAmount
        ? Number((restAmount / Math.pow(10, 18)).toFixed(2))
        : 0,
      sellingPrice: sellingPrice
        ? Number((sellingPrice / Math.pow(10, 18)).toFixed(2))
        : undefined,
    };
  });
};

export const getProviderSubscriptions = async (
  web3: Web3,
  account: string
): Promise<Subscription[]> => {
  const networkId = await web3.eth.net.getId();
  if (networkId !== 42) {
    throw new Error(`networkId: ${networkId}`);
  }

  const deployedNetwork = (SubscriptionsContract.networks as any)[networkId];
  const contract = new web3.eth.Contract(
    SubscriptionsContract.abi as AbiItem[],
    deployedNetwork && deployedNetwork.address
  );

  const count = await contract.methods
    .getProviderSubscriptionCount(account)
    .call({ from: account });

  const getSubscriptionRequests = [];
  for (let i = 0; i < count; i++) {
    getSubscriptionRequests.push(
      contract.methods
        .getProviderSubscription(account, i)
        .call({ from: account })
    );
  }

  const subscriptions = await Promise.all(getSubscriptionRequests);
  return getMappedSubscriptions(subscriptions);
};

export const getSellingSubscriptions = async (
  web3: Web3,
  account: string
): Promise<Subscription[]> => {
  const networkId = await web3.eth.net.getId();
  if (networkId !== 42) {
    throw new Error(`networkId: ${networkId}`);
  }

  const deployedNetwork = (SubscriptionsContract.networks as any)[networkId];
  const contract = new web3.eth.Contract(
    SubscriptionsContract.abi as AbiItem[],
    deployedNetwork && deployedNetwork.address
  );

  console.log("get selling count init");
  const count = await contract.methods.sellingCount().call({ from: account });
  console.log("get selling count done", count);
  const getSubscriptionRequests = [];
  for (let i = 0; i < count; i++) {
    getSubscriptionRequests.push(
      contract.methods.getSellingSubscription(i).call({ from: account })
    );
  }

  console.log("get selling init");
  const subscriptions = await Promise.all(getSubscriptionRequests);
  console.log("get selling count done");
  return getMappedSubscriptions(subscriptions);
};

export const concatWithSelling = (
  subscriptions: Subscription[],
  selling: Subscription[]
) => {
  return subscriptions.map(
    (subscriptions: Subscription): Subscription => {
      const isSelling = selling.find(
        ({ id }: Subscription) => id === subscriptions.id
      );

      return isSelling
        ? {
            ...subscriptions,
            isSelling: true,
          }
        : subscriptions;
    }
  );
};

export const approve = async (
  web3: Web3,
  account: string,
  tokenAddress: string,
  amount: string
): Promise<void> => {
  const networkId = await web3.eth.net.getId();
  if (networkId !== 42) {
    throw new Error(`networkId: ${networkId}`);
  }

  const deployedNetwork = (SubscriptionsContract.networks as any)[networkId];

  const IERC20ContractInstance = new web3.eth.Contract(
    IERC20Contract.abi as AbiItem[],
    tokenAddress
  );

  await IERC20ContractInstance.methods
    .approve(deployedNetwork.address, amount)
    .send({ from: account });
};

export const buySubscription = async (
  web3: Web3,
  account: string,
  subscriptionId: string
) => {
  const networkId = await web3.eth.net.getId();
  if (networkId !== 42) {
    throw new Error(`networkId: ${networkId}`);
  }

  const deployedNetwork = (SubscriptionsContract.networks as any)[networkId];
  const contract = new web3.eth.Contract(
    SubscriptionsContract.abi as AbiItem[],
    deployedNetwork && deployedNetwork.address
  );

  await contract.methods.buy(subscriptionId).send({ from: account });
};

export const withdrawSubscription = async (
  web3: Web3,
  account: string,
  subscriptionId: string
) => {
  const networkId = await web3.eth.net.getId();
  if (networkId !== 42) {
    throw new Error(`networkId: ${networkId}`);
  }

  const deployedNetwork = (SubscriptionsContract.networks as any)[networkId];
  const contract = new web3.eth.Contract(
    SubscriptionsContract.abi as AbiItem[],
    deployedNetwork && deployedNetwork.address
  );

  await contract.methods.withdraw(subscriptionId).send({ from: account });
};
