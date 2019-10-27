import { Button, Form, Input, InputNumber, message, Select } from "antd";
import { FormComponentProps } from "antd/es/form";
import { OptionProps } from "antd/es/select";
import React from "react";
import { Content } from "../../core/layout/Content";
import { ConnectForm, ConnectFormConfig } from "../ConnectForm/ConnectForm";
import ClipboardJS from "clipboard";

import "./SubscriptionForm.css";

const STYLES_SNIPPET =
  '<link href="/static/css/2.chunk.css" rel="stylesheet" /><link href="/static/css/main.chunk.css" rel="stylesheet" />';
const SCRIPTS_SNIPPET =
  '<script src="/static/js/runtime-main.js"></script><script src="/static/js/2.chunk.js"></script><script src="/static/js/main.chunk.js"></script>';
const INIT_SNIPPET = (config: ConnectFormConfig) =>
  `<button onclick='window.easyscribe.open(${JSON.stringify(config)})'>Take my money</button><div id='easyscribe-root'></div>`;

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
    title: "DAI",
  },
];

class SubscriptionForm extends React.Component<Props, State> {
  state: State = {
    isParamsValid: false,
  };

  componentDidMount() {
    new ClipboardJS(".btn");
  }

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
      periodCount: config.periodCount.toString(),
      paymentMethods: paymentMethodOptions,
    } as any;
  };

  renderPeriod = () => {
    const {
      form: { getFieldDecorator },
    } = this.props;

    return (
      <Form.Item label="Period (min)">
        {getFieldDecorator("period", { initialValue: 1 })(<InputNumber />)}
      </Form.Item>
    );
  };

  renderPeriodCount = () => {
    const {
      form: { getFieldDecorator },
    } = this.props;

    return (
      <Form.Item label="Period count">
        {getFieldDecorator("periodCount", { initialValue: 2 })(<InputNumber />)}
      </Form.Item>
    );
  };

  renderPrice = () => {
    const {
      form: { getFieldDecorator },
    } = this.props;

    return (
      <Form.Item label="Amount ($)">
        {getFieldDecorator("amount", { initialValue: 0.01 })(<InputNumber />)}
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
            <Select defaultActiveFirstOption>
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
      <div className="form-params-wrapper">
        <Form onChange={this.handleFormChange} className="subscription-form">
          {this.renderPeriod()}
          {this.renderPeriodCount()}
          {this.renderPrice()}
          {this.renderPaymentMethod()}
        </Form>
      </div>
    );
  };

  renderFormPreview = () => {
    const { account, web3 } = this.props;

    return (
      <ConnectForm
        account={account}
        web3={web3}
        config={this.getFormConfig()}
      />
    );
  };

  renderSuccessCopyMessage = () => message.success("Copied!");

  renderStyleBlock = () => {
    return (
      <Button
        className="btn"
        data-clipboard-text={STYLES_SNIPPET}
        onClick={this.renderSuccessCopyMessage}
      >
        Copy styles
      </Button>
    );
  };

  renderScriptBlock = () => {
    return (
      <Button
        className="btn"
        data-clipboard-text={SCRIPTS_SNIPPET}
        onClick={this.renderSuccessCopyMessage}
      >
        Copy scripts
      </Button>
    );
  };

  renderInitBlock = () => {
    return (
      <Button
        className="btn"
        data-clipboard-text={INIT_SNIPPET(this.getFormConfig())}
        onClick={this.renderSuccessCopyMessage}
      >
        Copy init script
      </Button>
    );
  };

  renderFormConnectScript = () => {
    return (
      <div className="connect-block">
        {this.renderStyleBlock()}
        {this.renderScriptBlock()}
        {this.renderInitBlock()}
      </div>
    );
  };

  renderForm = () => {
    return (
      <div className="form-preview-wrapper">
        {this.renderFormPreview()}
        {this.renderFormConnectScript()}
      </div>
    );
  };

  render() {
    return (
      <Content title="Connect service">
        <div className="form-configurator">
          {this.renderParamsForm()}
          {this.renderForm()}
        </div>
      </Content>
    );
  }
}

const WrappedForm = Form.create<any>()(SubscriptionForm);

export { WrappedForm as SubscriptionForm };
