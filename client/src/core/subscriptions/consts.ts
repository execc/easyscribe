import { OptionProps } from "antd/es/select";

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

export const paymentMethodOptions: any[] = [
  {
    value: "0xc4375b7de8af5a38a93548eb8453a498222c4ff2",
    title: "DAI",
    icon: "/images/dai.jpg",
  },
];

export const getServiceNames = (address: string): string => {
  switch (address.toLocaleLowerCase()) {
    case "0x7dB647031EE753604CC3aE49592de4C09818f23b".toLocaleLowerCase():
      return "Yandex.Music";
    case "0x8D933D915Ae4f74D1b5BA32466c5676F2E15E5A1".toLocaleLowerCase():
      return "Apple.Music";
    case "0x5C614f3913a381cF74cBA2F55d57902EC60CC4F7".toLocaleLowerCase():
      return "Google.Music";
    default:
      return "";
  }
};
