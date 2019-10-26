import { message, Table, Tabs, Button, Tag } from "antd";
import React, { Component } from "react";
import { Content } from "../../core/layout/Content";
import SubscriptionsContract from "../../contracts/Subscriptions.json";

import "./ProviderSubscribers.css";
import {
  SubscriptionsTab,
  SubscriptionStatus,
} from "../../core/subscriptions/consts";
import { getMappedSubscriptions } from "../../core/subscriptions/utils";

const { TabPane } = Tabs;

const UPDATE_INTERVAL = 10 * 1000;
const OPERATION_WAITING_INTERVAL = 120 * 1000;

type Props = {
  account: any;
  web3: any;
};

type State = {
  contract: any;
  tab: SubscriptionsTab;
  subscriptions: any[];
  subscribersLoading: boolean;
  waitingSubscribersIds: string[];
};

export class ProviderSubscribers extends Component<Props, State> {
  subscriptionsUpdateTimeout: any;
  waitingSubscriptionIntervals: any = {};

  state: State = {
    contract: null,
    tab: SubscriptionsTab.ACTIVE,
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

      const count = await contract.methods
        .getProviderSubscriptionCount(this.props.account)
        .call({ from: this.props.account });

      const getSubscriptionRequests = [];
      for (let i = 0; i < count; i++) {
        getSubscriptionRequests.push(
          contract.methods
            .getProviderSubscription(this.props.account, i)
            .call({ from: this.props.account })
        );
      }

      const subscriptions = await Promise.all(getSubscriptionRequests);
      const mapedSubscriptions = getMappedSubscriptions(subscriptions);

      this.setState({
        subscriptions: mapedSubscriptions,
        subscribersLoading: withLoading ? false : this.state.subscribersLoading,
        waitingSubscribersIds: this.state.waitingSubscribersIds.filter(
          (id: string) => {
            const newSub = mapedSubscriptions.find(
              subscription => subscription.id === id
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

    return subscriptions.filter(({ status }: any) => {
      return tab === SubscriptionsTab.ACTIVE
        ? status === SubscriptionStatus.ACTIVE
        : status !== SubscriptionStatus.ACTIVE;
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

  handleOnTabChange = (tab: SubscriptionsTab) => {
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

      await contract.methods.withdraw(id).send({ from: this.props.account });

      await contract.methods.sell(id, "0.1").send({ from: this.props.account });
    } catch (error) {
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

  renderActions = (record: any) => {
    const { id, status } = record;
    const { waitingSubscribersIds } = this.state;

    const waiting = waitingSubscribersIds.includes(id);

    if (status === SubscriptionStatus.ACTIVE) {
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
        <TabPane tab={SubscriptionsTab.ACTIVE} key={SubscriptionsTab.ACTIVE} />
        <TabPane
          tab={SubscriptionsTab.INACTIVE}
          key={SubscriptionsTab.INACTIVE}
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
