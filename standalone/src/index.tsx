import React from "react";
import ReactDOM from "react-dom";
import {
  ConnectForm,
  ConnectFormConfig,
} from "./modules/ConnectForm/ConnectForm";

const open = (config: ConnectFormConfig) => {
  ReactDOM.render(
    <ConnectForm config={config} modalMode />,
    document.getElementById("easyscribe-root")
  );
};

(window as any).easyscribe = {
  open,
};
