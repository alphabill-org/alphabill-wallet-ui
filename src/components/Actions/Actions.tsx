import classNames from "classnames";
import { useState } from "react";

import Button from "../Button/Button";
import Spacer from "../Spacer/Spacer";
import { IActionProps } from "../../types/Types";
import { ReactComponent as Arrow } from "../../images/arrow.svg";

function Actions({
  actionsView,
  setIsActionsViewVisible,
  isActionsViewVisible,
}: IActionProps): JSX.Element | null {
  return (
    <div
      className={classNames("actions", { "is-visible": isActionsViewVisible })}
    >
      <div className="actions__header">
        <Button
          onClick={() => setIsActionsViewVisible(!isActionsViewVisible)}
          variant="icon"
        >
          <Arrow />
        </Button>
        <div className="actions__title">{actionsView}</div>
      </div>
      <Spacer mb={8} />

      <div className="actions__footer"></div>
    </div>
  );
}

export default Actions;
