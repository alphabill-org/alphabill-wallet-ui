import { ReactElement } from "react";
import LoadingBallIcon from "../../images/loading/loading-circle.svg?react";
import LoadingBackgroundIcon from "../../images/loading/loading-bg.svg?react";

interface IProps {
  title?: string;
}

export function Loading({ title }: IProps): ReactElement {
  return (
    <div className="loading">
      <div className="loading__content">
        <span>
          <LoadingBackgroundIcon />
          <LoadingBallIcon />
        </span>
        <div>{title}</div>
      </div>
    </div>
  );
}
