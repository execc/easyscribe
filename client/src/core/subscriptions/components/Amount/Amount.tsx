import React from "react";
import {Subscription} from "../../models";
import "./Amount.css";

type Props = {
    subscription: Subscription;
}

export class Amount extends React.Component<Props> {
    renderToken = () => {
        const {subscription: {tokenName, tokenImage}} = this.props;

        if (tokenImage) {
            return <img className="token-image" src={tokenImage}/>
        }

        if (tokenName) {
            return tokenName;
        }
    };

    render() {
        const {subscription: {amount}} = this.props;

        return (
            <div className="amount">
                {amount}&nbsp;{this.renderToken()}
            </div>
        );
    }
}