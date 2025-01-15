import { ReactElement } from "react";
import Button from "../../components/Button/Button";

export function Footer({
  previousLabel = "Back",
  nextLabel = "Next",
  previous,
}: {
  previousLabel?: string;
  nextLabel?: string;
  previous: () => void;
}): ReactElement {
  return (
    <div className="create-account__footer">
      <Button type="button" variant="secondary" className="create-account__footer__cancel" onClick={previous}>
        {previousLabel}
      </Button>
      <Button type="submit" variant="primary" className="create-account__footer__next">
        {nextLabel}
      </Button>
    </div>
  );
}
