import { Button, message, Table, Tabs, Tag } from "antd";
import React, { Component } from "react";
import { Content } from "../../core/layout/Content";
import {
  MarketSubscriptionsTab,
  SubscriptionStatus,
} from "../../core/subscriptions/consts";
import { Subscription } from "../../core/subscriptions/models";
import {
  approve,
  buySubscription,
  getSellingSubscriptions,
  withdrawSubscription,
} from "../../core/subscriptions/utils";

import "./Market.css";

const { TabPane } = Tabs;

const UPDATE_INTERVAL = 10 * 1000;
const OPERATION_WAITING_INTERVAL = 120 * 1000;

type Props = {
  account: any;
  web3: any;
};

type State = {
  contract: any;
  tab: MarketSubscriptionsTab;
  subscriptions: any[];
  subscriptionsLoading: boolean;
  waitingSubscriptionIds: string[];
};

export class Market extends Component<Props, State> {
  subscriptionsUpdateTimeout: any;
  waitingSubscriptionIntervals: any = {};

  state: State = {
    contract: null,
    tab: MarketSubscriptionsTab.ACTIVE,
    subscriptions: [],
    subscriptionsLoading: false,
    waitingSubscriptionIds: [],
  };

  componentDidMount(): void {
    this.getSubsciptions(true);

    this.subscriptionsUpdateTimeout = setInterval(
      () => this.getSubsciptions(),
      UPDATE_INTERVAL
    );
  }

  componentWillUnmount(): void {
    if (this.subscriptionsUpdateTimeout) {
      clearInterval(this.subscriptionsUpdateTimeout);
    }

    this.clearWaitingIntervals(Object.keys(this.waitingSubscriptionIntervals));
  }

  clearWaitingIntervals = (ids: string[]) => {
    ids.forEach((id: string) => {
      delete this.waitingSubscriptionIntervals[id];
    });

    this.setState({
      waitingSubscriptionIds: this.state.waitingSubscriptionIds.filter(
        (id: string) => !ids.includes(id)
      ),
    });
  };

  getSubsciptions = async (withLoading?: boolean) => {
    this.setState({
      subscriptionsLoading: withLoading
        ? true
        : this.state.subscriptionsLoading,
    });

    try {
      const { web3, account } = this.props;

      const newSubscriptions = await getSellingSubscriptions(web3, account);

      this.setState({
        subscriptions: newSubscriptions,
        subscriptionsLoading: withLoading
          ? false
          : this.state.subscriptionsLoading,
        waitingSubscriptionIds: this.state.waitingSubscriptionIds.filter(
          (id: string) => {
            const newSub = newSubscriptions.find(
              (subscription: Subscription) => subscription.id === id
            );
            const oldSub = this.state.subscriptions.find(
              subscription => subscription.id === id
            );

            return newSub && oldSub && newSub.status === oldSub.status;
          }
        ),
      });
    } catch (error) {
      this.setState({
        subscriptionsLoading: withLoading
          ? false
          : this.state.subscriptionsLoading,
      });
      message.error("Произошла ошибка получении подписок");
      console.error(error);
    }
  };

  getColumns = () => [
    {
      title: "Service",
      dataIndex: "serviceName",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: this.renderStatus,
    },
    {
      title: "Amount",
      render: (record: Subscription) => `${record.amount} ${record.tokenName}`,
    },
    {
      title: "Period",
      dataIndex: "period",
      render: (period: string) => `${period} min`
    },
    {
      title: "Period count",
      dataIndex: "periodCount",
    },
    {
      title: "Rest amount",
      dataIndex: "restAmount",
    },
    {
      title: "Actions",
      render: this.renderActions,
    },
  ];

  getTableData = () => {
    const { subscriptions, tab } = this.state;
    const { account } = this.props;

    return subscriptions.filter(({ status, receiverAddress }: Subscription) => {
      const isMyLot = account.toLocaleLowerCase() === receiverAddress.toLocaleLowerCase();

      switch (tab) {
        case MarketSubscriptionsTab.ACTIVE:
          return status === SubscriptionStatus.ACTIVE && !isMyLot;
        case MarketSubscriptionsTab.INACTIVE:
          return status === SubscriptionStatus.INACTIVE && !isMyLot;
        case MarketSubscriptionsTab.MY_LOTS:
          return isMyLot;
      }
    });
  };

  addWaitingId = (id: string) => {
    const { waitingSubscriptionIds } = this.state;

    this.setState({
      waitingSubscriptionIds: [...waitingSubscriptionIds, id],
    });

    this.waitingSubscriptionIntervals[id] = setTimeout(
      () => this.clearWaitingIntervals([id]),
      OPERATION_WAITING_INTERVAL
    );
  };

  handleOnTabChange = (tab: MarketSubscriptionsTab) => {
    this.setState({
      tab,
    });
  };

  handleBuyFactory = (id: string) => async () => {
    try {
      this.addWaitingId(id);

      const { web3, account } = this.props;
      const { subscriptions } = this.state;

      const { token, periodCount, amount } = subscriptions.find(
        (subscription: Subscription) => subscription.id === id
      );

      await approve(
        web3,
        account,
        token,
        (Number(periodCount) * Number(amount) * Math.pow(10, 18)).toString()
      );
      await buySubscription(web3, account, id);
    } catch (error) {
      this.clearWaitingIntervals([id]);
      message.error("Buying ends with error");
      console.error(error);
    }
  };

  handleWithdrawFactory = (id: string) => async () => {
    try {
      this.addWaitingId(id);

      const { web3, account } = this.props;

      await withdrawSubscription(web3, account, id);
    } catch (error) {
      this.clearWaitingIntervals([id]);
      message.error("Sell ends with error");
      console.error(error);
    }
  };

  renderStatus = (status: SubscriptionStatus) => {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
        return <Tag color="green">Active</Tag>;
      case SubscriptionStatus.INACTIVE:
        return <Tag color="red">Inactive</Tag>;
      default:
        return status;
    }
  };

  renderActions = (record: Subscription) => {
    const { id, status, receiverAddress } = record;
    const { waitingSubscriptionIds } = this.state;
    const { account } = this.props;

    const waiting = waitingSubscriptionIds.includes(id);
    const isMyLot = account.toLocaleLowerCase() === receiverAddress.toLocaleLowerCase();

    if (status === SubscriptionStatus.ACTIVE && !isMyLot) {
      return (
        <Button
          type="ghost"
          disabled={waiting}
          loading={waiting}
          onClick={this.handleBuyFactory(record.id)}
        >
          Buy
        </Button>
      );
    }

    if (isMyLot) {
      return (
        <Button
          type="ghost"
          disabled={waiting}
          loading={waiting}
          onClick={this.handleWithdrawFactory(record.id)}
        >
          Withdraw
        </Button>
      );
    }

    return null;
  };

  renderTabs = () => {
    const { tab } = this.state;

    return (
      <Tabs activeKey={tab} onChange={this.handleOnTabChange as any}>
        <TabPane
          tab={MarketSubscriptionsTab.ACTIVE}
          key={MarketSubscriptionsTab.ACTIVE}
        />
        <TabPane
          tab={MarketSubscriptionsTab.INACTIVE}
          key={MarketSubscriptionsTab.INACTIVE}
        />
        <TabPane
          tab={MarketSubscriptionsTab.MY_LOTS}
          key={MarketSubscriptionsTab.MY_LOTS}
        />
      </Tabs>
    );
  };

  renderTable = () => {
    const { subscriptionsLoading } = this.state;

    return (
      <Table
        columns={this.getColumns()}
        locale={{
          emptyText: (
            <div style={{ padding: "5px" }}>You have not subscriptions yet</div>
          ),
        }}
        loading={subscriptionsLoading}
        dataSource={this.getTableData()}
      />
    );
  };

  render() {
    return (
      <Content title="Market">
        {this.renderTabs()}
        {this.renderTable()}
      </Content>
    );
  }
}
