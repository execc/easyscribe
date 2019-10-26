import { Button, Form, message, Modal, Select } from "antd";
import { FormComponentProps } from "antd/es/form";
import { OptionProps } from "antd/es/select";
import React, { FormEvent } from "react";

import "./ConnectForm.css";
import SubscriptionsContract from "../../contracts/Subscriptions.json";
import IERC20Contract from "../../contracts/IERC20.json";

export type ConnectFormConfig = {
  amount: string;
  period: string;
  periodCount: string;
  accountTo: string;
  paymentMethods: OptionProps[];
};

type OwnProps = {
  web3: any;
  account: any;
  config: ConnectFormConfig;
  modalMode?: boolean;
};

type Props = OwnProps & FormComponentProps;

type State = {
  processing: boolean;
  visible: boolean;
};

class ConnectForm extends React.Component<Props, State> {
  state: State = {
    processing: false,
    visible: true,
  };

  handleClose = () => {
    this.setState({
      visible: false,
    });
  };

  handleSubscribe = async () => {
    this.setState({
      processing: true,
    });

    try {
      const {
        web3,
        config: { period, amount, accountTo, periodCount },
        form: { getFieldsValue },
      } = this.props;

      const tokenAddress = getFieldsValue().paymentMethod;

      const networkId = await web3.eth.net.getId();
      if (networkId !== 42) {
        throw new Error(`networkId: ${networkId}`);
      }

      const deployedNetwork = (SubscriptionsContract.networks as any)[
        networkId
      ];

      const IERC20ContractInstance = new web3.eth.Contract(
        IERC20Contract.abi,
        tokenAddress
      );

      await IERC20ContractInstance.methods
        .approve(
          deployedNetwork.address,
          (Number(periodCount) * Number(amount)).toString()
        )
        .send({ from: this.props.account });

      const SubscriptionsContractInstance = new web3.eth.Contract(
        SubscriptionsContract.abi,
        deployedNetwork && deployedNetwork.address
      );

      await SubscriptionsContractInstance.methods
        .createSubscription(
          tokenAddress,
          accountTo,
          period,
          amount,
          periodCount
        )
        .send({ from: this.props.account });

      message.success("You successfully subscribed");

      this.setState({
        processing: false,
      });
    } catch (error) {
      this.setState({
        processing: false,
      });
      message.error("Subscription process ends with error");
      console.error(error);
    }
  };

  handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    this.props.form.validateFields(err => {
      if (!err) {
        this.handleSubscribe();
      }
    });
  };

  renderAmount = () => {
    const {
      config: { amount },
    } = this.props;

    return (
      <div>
        Amount:{" "}
        {typeof amount === "undefined"
          ? null
          : Number(amount) / Math.pow(10, 18)}
      </div>
    );
  };

  renderPeriod = () => {
    const {
      config: { period },
    } = this.props;

    return (
      <div>
        Period: {typeof period === "undefined" ? null : Number(period) / 60}
      </div>
    );
  };

  renderPeriodCount = () => {
    const {
      config: { periodCount },
    } = this.props;

    return <div>Period count: {periodCount}</div>;
  };

  renderPaymentInfo = () => {
    return (
      <>
        {this.renderAmount()}
        {this.renderPeriod()}
        {this.renderPeriodCount()}
      </>
    );
  };

  renderPaymentMethods = () => {
    const {
      form: { getFieldDecorator },
      config: { paymentMethods },
    } = this.props;
    const { processing } = this.state;

    if (!paymentMethods) {
      return null;
    }

    return (
      <Form.Item label="Payment method">
        {getFieldDecorator("paymentMethod", {
          rules: [{ required: true, message: "Please choose payment method" }],
        })(
          <Select
            placeholder="Payment method"
            defaultActiveFirstOption
            disabled={processing}
          >
            {paymentMethods.map(method => (
              <Select.Option key={method.value}>{method.title}</Select.Option>
            ))}
          </Select>
        )}
      </Form.Item>
    );
  };

  renderForm = () => {
    const { processing } = this.state;

    return (
      <Form className="subscribe-form" onSubmit={this.handleSubmit}>
        <div className="subscribe-form-header">Subscription</div>
        {this.renderPaymentInfo()}
        {this.renderPaymentMethods()}
        <Form.Item className="subscribe-form-footer">
          <Button
            type="primary"
            htmlType="submit"
            disabled={processing}
            loading={processing}
            className="subscribe-button"
          >
            Subscribe
          </Button>
          <div className="additional-info">
            You can cancel the subscription in any time and receive you money
            back!
            <br />
            Manage you subscriptions on&nbsp;
            <a href="http://127.0.0.1:3000/#/subscriptions">
              subscriptions panel
            </a>
          </div>
        </Form.Item>
      </Form>
    );
  };

  renderModal = () => {
    const { visible } = this.state;

    return (
      <Modal visible={visible} onCancel={this.handleClose}>
        {this.renderForm()}
      </Modal>
    );
  };

  render() {
    const { modalMode } = this.props;

    return modalMode ? this.renderModal() : this.renderForm();
  }
}

const WrappedForm = Form.create<any>()(ConnectForm);

export { WrappedForm as ConnectForm };
