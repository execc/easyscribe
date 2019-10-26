import { message, Spin } from "antd";
import React, { Component } from "react";
import { Route, Router, Switch } from "react-router";
import { SubscriptionForm } from "./modules/SubscriptionForm/SubscriptionForm";
import { Subscriptions } from "./modules/Subscriptions/Subscriptions";
import getWeb3 from "./utils/getWeb3";
import { createHashHistory } from "history";

import "./App.css";
import "antd/dist/antd.css";

type State = {
  account: any;
};

const history = createHashHistory();

class App extends Component<{}, State> {
  web3: any;

  state: State = { account: null };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();

      if (networkId !== 42) {
        throw new Error(`networkId: ${networkId}`);
      }

      this.web3 = web3;
      this.setState({ account: accounts[0] });
    } catch (error) {
      // Catch any errors for any of the above operations.
      message.error("Произошла ошибка при инициализации приложения");
      console.error(error);
    }
  };

  render() {
    const { account } = this.state;

    if (!account) {
      return (
        <div className="spin-wrapper">
          <Spin size="large" />
        </div>
      );
    }

    return (
      <Router history={history}>
        <Switch>
          <Route
            path="/subscriptions"
            component={() => (
              <Subscriptions account={account} web3={this.web3} />
            )}
          />
          <Route
            path="/connect-form"
            component={() => (
              <SubscriptionForm account={account} web3={this.web3} />
            )}
          />
          <Route component={() => <div>404</div>} />
        </Switch>
      </Router>
    );
  }
}

export { App };
