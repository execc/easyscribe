import { message, Table, Tabs, Button, Tag } from "antd";
import React, { Component } from "react";
import { Content } from "../../core/layout/Content";
import SubscriptionsContract from "../../contracts/Subscriptions.json";
import { format } from "date-fns";

import "./Subscriptions.css";

const { TabPane } = Tabs;

type Props = {
  account: any;
  web3: any;
};

type State = {
  contract: any;
  tab: SubscriptionsTab;
  subscriptions: any[];
  subscriptionsLoading: boolean;
};

enum SubscriptionsTab {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
}

enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

type Subscription = {
  id: string;
  token: string;
  receiverAddress: string;
  period: number; // В минутах
  amount: number; // В долларах
  lastPayment: Date;
  status: SubscriptionStatus;
};

const getMappedSubscriptions = (subscriptions: any[]): Subscription[] => {
  return subscriptions.map(subscription => ({
    id: subscription[0],
    token: subscription[2],
    receiverAddress: subscription[3],
    period: subscription[4] / 60,
    amount: subscription[5] / Math.pow(10, 18),
    lastPayment: new Date(Number(subscription[6])),
    status: subscription[7]
      ? SubscriptionStatus.INACTIVE
      : SubscriptionStatus.ACTIVE,
  }));
};

export class Subscriptions extends Component<Props, State> {
  subscriptionsUpdateTimeout: any;

  state: State = {
    contract: null,
    tab: SubscriptionsTab.ACTIVE,
    subscriptions: [],
    subscriptionsLoading: false,
  };

  componentDidMount(): void {
    this.getSubsciptions(true);

    this.subscriptionsUpdateTimeout = setInterval(
      () => this.getSubsciptions(),
      60 * 1000
    );
  }

  componentWillUnmount(): void {
    if (this.subscriptionsUpdateTimeout) {
      clearInterval(this.subscriptionsUpdateTimeout);
    }
  }

  getSubsciptions = async (withLoading?: boolean) => {
    this.setState({
      subscriptionsLoading: withLoading
        ? true
        : this.state.subscriptionsLoading,
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
        .getClientSubscriptionCount(this.props.account)
        .call({ from: this.props.account });

      const getSubscriptionRequests = [];
      for (let i = 0; i < count; i++) {
        getSubscriptionRequests.push(
          contract.methods
            .getClientSubscription(this.props.account, i)
            .call({ from: this.props.account })
        );
      }

      const subscriptions = await Promise.all(getSubscriptionRequests);
      this.setState({
        subscriptions: getMappedSubscriptions(subscriptions),
        subscriptionsLoading: withLoading
          ? false
          : this.state.subscriptionsLoading,
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
      dataIndex: "amount",
    },
    {
      title: "Last payment",
      dataIndex: "lastPayment",
      render: (date: Date) => format(date, "dd.MM.yyyy HH:mm"),
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

  handleOnTabChange = (tab: SubscriptionsTab) => {
    this.setState({
      tab,
    });
  };

  handleCancelFactory = (id: string) => async () => {
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

      await contract.methods
        .cancelSubscription(id)
        .send({ from: this.props.account });
    } catch (error) {
      message.error("Произошла ошибка при отмене подписки");
      console.error(error);
    }
  };

  renderStatus = (status: SubscriptionStatus) => {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
        return <Tag color="green">Active</Tag>;
      case SubscriptionStatus.INACTIVE:
        return <Tag color="red">Active</Tag>;
      default:
        return status;
    }
  };

  renderActions = (record: any) => {
    if (record.status === SubscriptionStatus.ACTIVE) {
      return (
        <Button type="ghost" onClick={this.handleCancelFactory(record.id)}>
          Cancel
        </Button>
      );
    }

    return null;
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
      <Content title="Subscriptions">
        {this.renderTabs()}
        {this.renderTable()}
      </Content>
    );
  }
}
