import classNames from "classnames";
import { ICInfo, ICSuccess, ICWarning } from "../../css/icons";

export enum AlertTypes {
  success = "success",
  failure = "failure",
  warning = "warning",
  info = "info",
}

export interface IAlertProps {
  message: string;
  isBorder?: boolean;
  isLightText?: boolean;
  isLightBackground?: boolean;
  isShadow?: boolean;
  alertType: "success" | "failure" | "info" | "warning";
}

const alertConfig = {
  [AlertTypes.success]: {
    icon: <ICSuccess />,
  },
  [AlertTypes.failure]: {
    icon: <ICWarning />,
  },
  [AlertTypes.warning]: {
    icon: <ICWarning />,
  },
  [AlertTypes.info]: {
    icon: <ICInfo />,
  },
};

export const Alert = ({ message, isBorder, alertType, isLightText, isLightBackground, isShadow }: IAlertProps) => {
  const { icon } = alertConfig[alertType as AlertTypes];

  const className = classNames(
    "alert",
    {
      "alert--bordered": isBorder,
      "alert--text-light": isLightText,
      "alert--bg-light": isLightBackground,
      "alert--shadow": isShadow,
    },
    [`alert--${alertType}`],
  );
  return (
    <div className={className}>
      <div className={`alert-icon alert-icon--${alertType}`}>{icon}</div>
      <div className="alert-message">{message}</div>
    </div>
  );
};
