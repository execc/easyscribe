import { message, Table, Tabs, Button, Tag } from "antd";
import React, { Component } from "react";
import { Content } from "../../core/layout/Content";
import getWeb3 from "../../utils/getWeb3";
import SimpleStorageContract from "../../contracts/SimpleStorage.json";

import "./Subscriptions.css";

const { TabPane } = Tabs;

type Props = {
  account: any;
};

type State = {
  contract: any;
  tab: SubscriptionsTab;
  subscriptions: any[];
};

enum SubscriptionsTab {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
}

enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
}

export class Subscriptions extends Component<Props, State> {
  web3: any;

  state: State = {
    contract: null,
    tab: SubscriptionsTab.ACTIVE,
    subscriptions: [
      {
        serviceName: "Ya.Music",
        status: SubscriptionStatus.ACTIVE,
        amount: "2$",
      },
    ],
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();

      if (networkId !== 42) {
        throw new Error(`networkId: ${networkId}`);
      }

      const deployedNetwork = (SimpleStorageContract.networks as any)[
        networkId
      ];
      const instance = new web3.eth.Contract(
        SimpleStorageContract.abi,
        deployedNetwork && deployedNetwork.address
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ contract: instance });

      this.web3 = web3;
    } catch (error) {
      // Catch any errors for any of the above operations.
      message.error("Произошла ошибка при инициализации приложения");
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
    return Promise.resolve();
  };

  renderStatus = (status: SubscriptionStatus) => {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
        return <Tag color="green">Active</Tag>;
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
    return (
      <Table
        columns={this.getColumns()}
        locale={{
          emptyText: (
            <div style={{ padding: "5px" }}>You have not subscriptions yet</div>
          ),
        }}
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
