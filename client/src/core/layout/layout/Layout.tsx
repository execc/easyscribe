import { Layout, Menu, Icon } from "antd";
import React from "react";
import { Link } from "react-router-dom";
import "./Layout.css";

const { Sider, Content } = Layout;

class CustomLayout extends React.Component {
  getMenuConfig = () => {
    return [
      {
        value: "subscriptions",
        title: "My subscriptions",
        icon: "container",
      },
      {
        value: "subscribers",
        title: "Subscribers",
        icon: "api",
      },
      {
        value: "market",
        title: "Market",
        icon: "shopping-cart",
      },
      {
        value: "connect-form",
        title: "Connect form",
        icon: "credit-card",
      },
    ];
  };

  renderSider = () => {
    return (
      <Sider width={200} style={{ background: "#fff" }}>
        <Menu
          mode="inline"
          defaultSelectedKeys={[window.location.hash.substr(2)]}
          style={{ height: "100%", borderRight: 0 }}
        >
          {this.getMenuConfig().map(menuItem => (
            <Menu.Item key={menuItem.value}>
              <Link to={menuItem.value}>
                <Icon type={menuItem.icon} />
                <span>{menuItem.title}</span>
              </Link>
            </Menu.Item>
          ))}
        </Menu>
      </Sider>
    );
  };

  render() {
    return (
      <Layout>
        {/*{this.renderHeader()}*/}
        <Layout>
          {this.renderSider()}
          <Content>{this.props.children}</Content>
        </Layout>
      </Layout>
    );
  }
}

export { CustomLayout as Layout };
