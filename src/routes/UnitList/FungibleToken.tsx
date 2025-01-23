import { ReactElement } from "react";
import AlphabillIcon from "../../images/ab-logo-ico.svg?react";

export function FungibleToken(): ReactElement {
  return (
    <div>
      <div style={{ marginBottom: "12px" }}>Assets</div>
      <div className="units__unit">
        <div className="units__unit--icon">
          <AlphabillIcon fill="#1C194E" style={{ width: "24px", height: "auto" }} />
        </div>
        <div className="units__unit--text">ALPHA</div>
        <div>1.00000000</div>
      </div>
      <div className="units__unit">ALPHA</div>
    </div>
  );
}
