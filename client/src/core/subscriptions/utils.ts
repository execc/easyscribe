import Web3 from "web3";
import { AbiItem } from "web3-utils";
import SubscriptionsContract from "../../contracts/Subscriptions.json";
import { SubscriptionStatus } from "./consts";
import { Subscription } from "./models";

export const getMappedSubscriptions = (
  subscriptions: any[]
): Subscription[] => {
  return subscriptions.map(subscription => ({
    key: subscription[0],
    id: subscription[0],
    token: subscription[2],
    receiverAddress: subscription[3],
    period: subscription[4] / 60,
    amount: subscription[5] / Math.pow(10, 18),
    lastPayment: new Date(Number(subscription[6])),
    status: subscription[7]
      ? SubscriptionStatus.INACTIVE
      : SubscriptionStatus.ACTIVE,
    periodCount: subscription[9],
  }));
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

  const count = await contract.methods.sellingCount().call({ from: account });

  const getSubscriptionRequests = [];
  for (let i = 0; i < count; i++) {
    getSubscriptionRequests.push(
      contract.methods.getSellingSubscription(i).call({ from: account })
    );
  }

  const subscriptions = await Promise.all(getSubscriptionRequests);
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
