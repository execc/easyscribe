import React from "react";

import "./Content.css";

type ContentProps = {
  title: string;
};

export class Content extends React.Component<ContentProps> {
  renderHeader = () => {
    const { title } = this.props;
    return <div className="header">{title}</div>;
  };

  render() {
    return (
      <>
        {this.renderHeader()}
        {this.props.children}
      </>
    );
  }
}
