import { message, Table, Tabs } from "antd";
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
};

enum SubscriptionsTab {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export class Subscriptions extends Component<Props, State> {
  web3: any;

  state: State = {
    contract: null,
    tab: SubscriptionsTab.ACTIVE,
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

  columns = [
    {
      title: "Service",
    },
    {
      title: "Status",
    },
    {
      title: "Amount",
    },
  ];

  handleOnTabChange = (tab: SubscriptionsTab) => {
    this.setState({
      tab,
    });
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
        columns={this.columns}
        locale={{
          emptyText: (
            <div style={{ padding: "5px" }}>You have not subscriptions yet</div>
          ),
        }}
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
