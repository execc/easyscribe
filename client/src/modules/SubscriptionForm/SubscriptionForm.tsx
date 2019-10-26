import { Form, Input, InputNumber, Select } from "antd";
import { FormComponentProps } from "antd/es/form";
import { OptionProps } from "antd/es/select";
import React from "react";
import { Content } from "../../core/layout/Content";
import { ConnectForm, ConnectFormConfig } from "../ConnectForm/ConnectForm";

import "./SubscriptionForm.css";

type OwnProps = {
  account: any;
  web3: any;
};

type State = {
  isParamsValid: boolean;
};

type Props = OwnProps & FormComponentProps;

const paymentMethodOptions: OptionProps[] = [
  {
    value: "0xc4375b7de8af5a38a93548eb8453a498222c4ff2",
    title: "DIA",
  },
];

class SubscriptionForm extends React.Component<Props, State> {
  state: State = {
    isParamsValid: false,
  };

  handleFormChange = () => {
    const { form } = this.props;

    form.validateFields(err => {
      this.setState({
        isParamsValid: !Boolean(err),
      });
    });
  };

  getFormConfig = (): ConnectFormConfig => {
    const { form } = this.props;

    const config = form.getFieldsValue();

    return {
      amount: (config.amount * Math.pow(10, 18)).toString(),
      accountTo: config.accountTo,
      period: (config.period * 60).toString(),
      paymentMethods: paymentMethodOptions,
    } as any;
  };

  renderPeriod = () => {
    const {
      form: { getFieldDecorator },
    } = this.props;

    return (
      <Form.Item label="Period (min)">
        {getFieldDecorator("period")(<InputNumber />)}
      </Form.Item>
    );
  };

  renderPrice = () => {
    const {
      form: { getFieldDecorator },
    } = this.props;

    return (
      <Form.Item label="Amount ($)">
        {getFieldDecorator("amount")(<InputNumber />)}
      </Form.Item>
    );
  };

  renderPaymentMethod = () => {
    const {
      form: { getFieldDecorator },
    } = this.props;

    return (
      <>
        <Form.Item label="Payment method">
          {getFieldDecorator("paymentMethod")(
            <Select>
              {paymentMethodOptions.map(option => (
                <Select.Option key={option.value}>{option.title}</Select.Option>
              ))}
            </Select>
          )}
        </Form.Item>
        <Form.Item label="Account">
          {getFieldDecorator("accountTo")(<Input />)}
        </Form.Item>
      </>
    );
  };

  renderParamsForm = () => {
    return (
      <Form onChange={this.handleFormChange} className="subscription-form">
        {this.renderPeriod()}
        {this.renderPrice()}
        {this.renderPaymentMethod()}
      </Form>
    );
  };

  render() {
    const { account, web3 } = this.props;

    return (
      <Content title="Connect service">
        {this.renderParamsForm()}
        <ConnectForm
          account={account}
          web3={web3}
          config={this.getFormConfig()}
        />
      </Content>
    );
  }
}

const WrappedForm = Form.create<any>()(SubscriptionForm);

export { WrappedForm as SubscriptionForm };
