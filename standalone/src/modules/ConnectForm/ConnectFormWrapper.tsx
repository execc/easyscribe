import React from "react";
import { ConnectForm, ConnectFormConfig } from "./ConnectForm";

type State = {
  visible: boolean;
  config: ConnectFormConfig;
};

export class ConnectFormWrapper extends React.Component<{}, State> {
  state: State = {
    visible: false,
    config: {
      amount: "0",
      period: "0",
      periodCount: "0",
      accountTo: "",
      paymentMethods: [],
    },
  };

  componentDidMount(): void {
    (window as any).easyscribe = {
      open: (config: ConnectFormConfig) => {
        this.handleOpen(config);
      },
    };
  }

  handleOpen = (config: ConnectFormConfig) => {
    this.setState({
      config,
      visible: true,
    });
  };

  handleClose = () => {
    this.setState({
      visible: false,
    });
  };

  render() {
    const { visible, config } = this.state;

    return (
      <ConnectForm
        config={config}
        visible={visible}
        modalMode
        onClose={this.handleClose}
      />
    );
  }
}
