import { Button, message, Table, Tabs, Tag } from "antd";
import React, { Component } from "react";
import SubscriptionsContract from "../../contracts/Subscriptions.json";
import { Content } from "../../core/layout/Content";
import {
  ProviderSubscriptionsTab,
  SubscriptionStatus,
} from "../../core/subscriptions/consts";
import { Subscription } from "../../core/subscriptions/models";
import {
  concatWithSelling,
  getProviderSubscriptions,
  getSellingSubscriptions,
  withdrawSubscription,
} from "../../core/subscriptions/utils";

import "./ProviderSubscribers.css";

const { TabPane } = Tabs;

const UPDATE_INTERVAL = 10 * 1000;
const OPERATION_WAITING_INTERVAL = 120 * 1000;

type Props = {
  account: any;
  web3: any;
};

type State = {
  contract: any;
  tab: ProviderSubscriptionsTab;
  subscriptions: any[];
  subscribersLoading: boolean;
  waitingSubscribersIds: string[];
};

export class ProviderSubscribers extends Component<Props, State> {
  subscriptionsUpdateTimeout: any;
  waitingSubscriptionIntervals: any = {};

  state: State = {
    contract: null,
    tab: ProviderSubscriptionsTab.ACTIVE,
    subscriptions: [],
    subscribersLoading: false,
    waitingSubscribersIds: [],
  };

  componentDidMount(): void {
    this.getSubscribers(true);

    this.subscriptionsUpdateTimeout = setInterval(
      () => this.getSubscribers(),
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
      waitingSubscribersIds: this.state.waitingSubscribersIds.filter(
        (id: string) => !ids.includes(id)
      ),
    });
  };

  getSubscribers = async (withLoading?: boolean) => {
    this.setState({
      subscribersLoading: withLoading ? true : this.state.subscribersLoading,
    });

    try {
      const { web3, account } = this.props;
      const sellingSubscriptions = await getSellingSubscriptions(web3, account);
      const providerSubscriptions = await getProviderSubscriptions(
        web3,
        account
      );

      const newSubscriptions = concatWithSelling(
        providerSubscriptions,
        sellingSubscriptions
      );

      const { waitingSubscribersIds } = this.state;
      const newWaitingSubscribersIds = waitingSubscribersIds.filter(
        (id: string) => {
          const newSub = newSubscriptions.find(
            (subscription: Subscription) => subscription.id === id
          );
          const oldSub = this.state.subscriptions.find(
            subscription => subscription.id === id
          );

          return (
            newSub &&
            oldSub &&
            newSub.status === oldSub.status &&
            newSub.isSelling === oldSub.isSelling
          );
        }
      );

      const updatedIds = waitingSubscribersIds.filter(
        (id: string) => !newWaitingSubscribersIds.includes(id)
      );
      this.clearWaitingIntervals(updatedIds);

      this.setState({
        subscriptions: newSubscriptions,
        subscribersLoading: withLoading ? false : this.state.subscribersLoading,
        waitingSubscribersIds: newWaitingSubscribersIds,
      });
    } catch (error) {
      this.setState({
        subscribersLoading: withLoading ? false : this.state.subscribersLoading,
      });
      message.error("Subscriptions receiving ends with error");
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
      dataIndex: "amount",
    },
    {
      title: "Period",
      dataIndex: "period",
    },
    {
      title: "Period count",
      dataIndex: "periodCount",
    },
    {
      title: "Total sum",
      render: (record: any) => record.amount * record.periodCount,
    },
    {
      title: "Actions",
      render: this.renderActions,
    },
  ];

  getTableData = () => {
    const { subscriptions, tab } = this.state;

    return subscriptions.filter(({ status, isSelling }: Subscription) => {
      switch (tab) {
        case ProviderSubscriptionsTab.ACTIVE:
          return status === SubscriptionStatus.ACTIVE && !isSelling;
        case ProviderSubscriptionsTab.INACTIVE:
          return status === SubscriptionStatus.INACTIVE && !isSelling;
        case ProviderSubscriptionsTab.ON_SALE:
          return isSelling;
      }
    });
  };

  addWaitingId = (id: string) => {
    const { waitingSubscribersIds } = this.state;

    this.setState({
      waitingSubscribersIds: [...waitingSubscribersIds, id],
    });

    this.waitingSubscriptionIntervals[id] = setTimeout(
      () => this.clearWaitingIntervals([id]),
      OPERATION_WAITING_INTERVAL
    );
  };

  handleOnTabChange = (tab: ProviderSubscriptionsTab) => {
    this.setState({
      tab,
    });
  };

  handleSellFactory = (id: string) => async () => {
    try {
      this.addWaitingId(id);

      const { web3 } = this.props;

      const networkId = await web3.eth.net.getId();
      if (networkId !== 42) {
        throw new Error(`networkId: ${networkId}`);
      }

      const deployedNetwork = (SubscriptionsContract.networks as any)[
        networkId
      ];
      const contract = new web3.eth.Contract(
        SubscriptionsContract.abi,
        deployedNetwork && deployedNetwork.address
      );

      await contract.methods
        .sell(id, (0.01 * Math.pow(10, 18)).toString())
        .send({ from: this.props.account });
    } catch (error) {
      this.clearWaitingIntervals([id]);
      message.error("Sell ends with error");
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
    const { id, status, isSelling } = record;
    const { waitingSubscribersIds } = this.state;

    const waiting = waitingSubscribersIds.includes(id);

    if (status === SubscriptionStatus.ACTIVE && !isSelling) {
      return (
        <Button
          type="ghost"
          disabled={waiting}
          loading={waiting}
          onClick={this.handleSellFactory(record.id)}
        >
          Sell
        </Button>
      );
    }

    if (isSelling) {
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

  renderTable = () => {
    const { subscribersLoading } = this.state;

    return (
      <Table
        columns={this.getColumns()}
        locale={{
          emptyText: (
            <div style={{ padding: "5px" }}>You have not subscribers yet</div>
          ),
        }}
        loading={subscribersLoading}
        dataSource={this.getTableData()}
      />
    );
  };

  renderTabs = () => {
    const { tab } = this.state;

    return (
      <Tabs activeKey={tab} onChange={this.handleOnTabChange as any}>
        <TabPane
          tab={ProviderSubscriptionsTab.ACTIVE}
          key={ProviderSubscriptionsTab.ACTIVE}
        />
        <TabPane
          tab={ProviderSubscriptionsTab.INACTIVE}
          key={ProviderSubscriptionsTab.INACTIVE}
        />
        <TabPane
          tab={ProviderSubscriptionsTab.ON_SALE}
          key={ProviderSubscriptionsTab.ON_SALE}
        />
      </Tabs>
    );
  };

  render() {
    return (
      <Content title="Subscribers">
        {this.renderTabs()}
        {this.renderTable()}
      </Content>
    );
  }
}
