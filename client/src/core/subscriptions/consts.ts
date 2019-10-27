import {OptionProps} from "antd/es/select";

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum SubscriptionsTab {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
}

export enum ProviderSubscriptionsTab {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
  ON_SALE = "On sale",
}

export enum MarketSubscriptionsTab {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
  MY_LOTS = "My lots",
}

export const paymentMethodOptions: OptionProps[] = [
  {
    value: "0xc4375b7de8af5a38a93548eb8453a498222c4ff2",
    title: "DAI",
  },
];