import React from 'react'
import Button from '../../Button/Button';
import { ICClaim } from '../../../css/icons/ICClaim';
type FeeCreditCardProps = {
  amount: string;
  label: string
}

const FeeCreditCard = ({amount, label} : FeeCreditCardProps) => {
  return (
    <div className='fee-credit-card'>
      <div className='fee-credit-card__label'>{label}</div>
      <div className='fee-credit-card__amount'>{amount}</div>
      <Button variant="icon" className='fee-credit-card__btn'>
        <ICClaim className='fee-credit-card__btn-icon'/>
        Reclaim
      </Button>
    </div>
  )
}

export default FeeCreditCard