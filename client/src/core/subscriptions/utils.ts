import {SubscriptionStatus} from "./consts";
import {Subscription} from "./models";

export const getMappedSubscriptions = (subscriptions: any[]): Subscription[] => {
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
