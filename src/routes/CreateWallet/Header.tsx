import { ReactElement } from "react";
import { Link } from "react-router-dom";
import CloseIcon from "../../images/close.svg?react";

export function Header({ title }: { title: string }): ReactElement {
  return (
    <div className="create-account__header">
      <div className="create-account__title">{title}</div>
      <Link to="/" className="close-btn">
        <CloseIcon />
      </Link>
    </div>
  );
}
