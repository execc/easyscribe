import { Form, Input, InputNumber } from "antd";
import { FormComponentProps } from "antd/es/form";
import React from "react";
import { Content } from "../../core/layout/Content";
import { ConnectForm } from "../ConnectForm/ConnectForm";

type OwnProps = {
  account: any;
  web3: any;
};

type State = {
  period: number;
  price: number;
};

type Props = OwnProps & FormComponentProps;

class SubscriptionForm extends React.Component<Props, State> {
  getFormConfig = () => {
    const { form } = this.props;

    return form.getFieldsValue();
  };
  renderPeriod = () => {
    const {
      form: { getFieldDecorator },
    } = this.props;

    return (
      <Form.Item label="Period">
        {getFieldDecorator("period")(<InputNumber />)}
      </Form.Item>
    );
  };

  renderPrice = () => {
    const {
      form: { getFieldDecorator },
    } = this.props;

    return (
      <Form.Item label="Amount">
        {getFieldDecorator("amount")(<InputNumber />)}
      </Form.Item>
    );
  };

  renderPaymentMethod = () => {
    const {
      form: { getFieldDecorator },
    } = this.props;

    return (
      <Form.Item label="Payment method">
        {getFieldDecorator("accountTo")(<Input />)}
      </Form.Item>
    );
  };

  renderParamsForm = () => {
    return (
      <Form>
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
          config={this.getFormConfig}
        />
      </Content>
    );
  }
}

const WrappedForm = Form.create<any>()(SubscriptionForm);

export { WrappedForm as SubscriptionForm };
