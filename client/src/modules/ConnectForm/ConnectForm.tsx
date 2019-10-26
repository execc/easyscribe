import { Button, Form, message, Select } from "antd";
import { FormComponentProps } from "antd/es/form";
import { OptionProps } from "antd/es/select";
import React, { FormEvent } from "react";

import "./ConnectForm.css";
import SubscriptionsContract from "../../contracts/Subscriptions.json";

export type ConnectFormConfig = {
  amount: string;
  period: string;
  accountTo: string;
  paymentMethods: OptionProps[];
};

type OwnProps = {
  web3: any;
  account: any;
  config: ConnectFormConfig;
};

type Props = OwnProps & FormComponentProps;

class ConnectForm extends React.Component<Props> {
  handleSubscribe = async () => {
    try {
      const {
        web3,
        config: { period, amount, accountTo },
        form: { getFieldsValue },
      } = this.props;

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
        .createSubscription(
          getFieldsValue().paymentMethod,
          accountTo,
          period,
          amount
        )
        .send({ from: this.props.account });
    } catch (error) {
      message.error("Произошла ошибка подписке");
      console.error(error);
      debugger;
    }
  };

  handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.handleSubscribe();
      }
    });
  };

  renderPaymentMethods = () => {
    const {
      form: { getFieldDecorator },
      config: { paymentMethods },
    } = this.props;

    if (!paymentMethods) {
      return null;
    }

    return (
      <Form.Item label="Payment method">
        {getFieldDecorator("paymentMethod")(
          <Select placeholder="Payment method" defaultActiveFirstOption>
            {paymentMethods.map(method => (
              <Select.Option key={method.value}>{method.title}</Select.Option>
            ))}
          </Select>
        )}
      </Form.Item>
    );
  };

  render() {
    return (
      <Form className="subscribe-form" onSubmit={this.handleSubmit}>
        <div className="subscribe-form-header">Subscription</div>
        {this.renderPaymentMethods()}
        <Form.Item className="subscribe-form-footer">
          <Button type="primary" htmlType="submit">
            Subscribe
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

const WrappedForm = Form.create<any>()(ConnectForm);

export { WrappedForm as ConnectForm };
