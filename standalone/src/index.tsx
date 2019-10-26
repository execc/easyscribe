import React from "react";
import ReactDOM from "react-dom";
import { ConnectForm } from "./modules/ConnectForm/ConnectForm";

const open = () => {
    ReactDOM.render(<ConnectForm />, document.getElementById("easychain-root"));
};
