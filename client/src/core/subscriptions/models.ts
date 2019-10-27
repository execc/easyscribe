import { SubscriptionStatus } from "./consts";

export type Subscription = {
  key: string;
  id: string;
  token: string;
  tokenName?: string;
  receiverAddress: string;
  serviceName: string;
  period: number; // В минутах
  periodCount: number;
  amount: number; // В долларах
  lastPayment: Date;
  status: SubscriptionStatus;
  isSelling?: boolean;
  restAmount: number;
  sellingPrice?: number;
};
