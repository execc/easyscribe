import { Button, Form, message, Select } from "antd";
import { FormComponentProps } from "antd/es/form";
import React, { FormEvent } from "react";

import "./ConnectForm.css";
import SubscriptionsContract from "../../contracts/Subscriptions.json";

type OwnProps = {
  web3: any;
  account: any;
  config: any;
};

type Props = OwnProps & FormComponentProps;

class ConnectForm extends React.Component<Props> {
  handleSubscribe = async () => {

    try {
      const {
        web3,
        account: accountFrom,
        config: { period, amount, accountTo },
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
        // .createSubscription("0xc4375b7de8af5a38a93548eb8453a498222c4ff2", accountTo, period, amount)
          .createSubscription("0xc4375b7de8af5a38a93548eb8453a498222c4ff2", "0x8D933D915Ae4f74D1b5BA32466c5676F2E15E5A1", 60, '10000000000000000')
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

  render() {
    const {
      config: { paymentMethod },
    } = this.props;

    return (
      <Form className="subscribe-form" onSubmit={this.handleSubmit}>
        <div className="subscribe-form-header">Subscription</div>
        <Form.Item label="Payment method">
          <Select placeholder="Payment method" defaultActiveFirstOption>
            <Select.Option key={paymentMethod || "ulala"}>{paymentMethod || "ulala"}</Select.Option>
            {/*{this.props.config.map(method => (*/}
            {/*  <Select.Option key={method}>{method}</Select.Option>*/}
            {/*))}*/}
          </Select>
        </Form.Item>
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
