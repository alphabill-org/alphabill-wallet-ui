import { ReactElement } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/Button/Button";

export function Footer({
  previousLabel = "Back",
  nextLabel = "Next",
  previousPage,
}: {
  previousLabel?: string;
  nextLabel?: string;
  previousPage: string;
}): ReactElement {
  return (
    <div className="create-account__footer">
      <Link to={previousPage}>
        <Button type="button" variant="secondary" className="create-account__footer__cancel">
          {previousLabel}
        </Button>
      </Link>
      <Button type="submit" variant="primary" className="create-account__footer__next">
        {nextLabel}
      </Button>
    </div>
  );
}
