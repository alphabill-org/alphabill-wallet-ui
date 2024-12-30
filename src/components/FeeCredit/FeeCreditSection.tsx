import { ICFeeLimit } from "../../css/icons"
import Button from "../Button/Button"
import FeeCreditCard from "./FeeCreditCard/FeeCreditCard"

const FeeCreditSection = () => {
  return (
    <div className="fee-credit-section">
      <div className="fee-credit-section__header">
        Transfer fee credit
        <Button variant="icon" className="fee-credit-section__header_btn">
          <ICFeeLimit className="fee-credit-section__header_btn-icon"/>
          Add credit
        </Button>
      </div>
      <div className="fee-credit-section__body">
        <FeeCreditCard amount="324234235" label="Alpha"/>
        <FeeCreditCard amount="0" label="UTP"/>
      </div>
    </div>
  )
}

export default FeeCreditSection