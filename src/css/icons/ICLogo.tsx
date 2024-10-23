import { ICProps } from "./ICTypes"

export const ICLogo = ({className} : ICProps) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="40" 
      height="24" 
      viewBox="0 0 40 24"
      className={className}
    >
      <path 
        d="M30.1824 0.294842H21.9926C21.8504 1.40419 21.6452 2.50454 21.378 3.59055C20.1828 2.40569 18.7588 1.4768 17.1929 0.860513C15.627 0.244228 13.9519 -0.0465028 12.2699 0.00603972C5.30192 0.00603972 0 4.55335 0 11.9816C0 19.4099 5.25749 23.9942 12.2255 23.9942C13.9159 24.0456 15.5991 23.7524 17.1726 23.1323C18.7461 22.5122 20.1769 21.5783 21.378 20.3875C21.6451 21.481 21.8503 22.5888 21.9926 23.7054H30.1824C29.3527 19.6233 27.9386 15.6822 25.9838 12.0038C27.9381 8.32268 29.3522 4.3792 30.1824 0.294842ZM12.4995 16.9067C11.529 16.9067 10.5804 16.6186 9.77376 16.0788C8.96715 15.5391 8.33886 14.7721 7.9685 13.8749C7.59813 12.9777 7.50239 11.9908 7.69334 11.0391C7.8843 10.0875 8.35339 9.21394 9.04118 8.52916C9.72896 7.84438 10.6045 7.37921 11.5568 7.19255C12.5092 7.00589 13.4955 7.10614 14.3909 7.48063C15.2862 7.85512 16.0503 8.48699 16.5862 9.29617C17.1222 10.1053 17.4059 11.0554 17.4015 12.0261C17.3956 13.3225 16.8766 14.5639 15.9579 15.4785C15.0392 16.3932 13.7957 16.9067 12.4995 16.9067Z"
      />
      <path 
        d="M35.0983 16.8154C37.8057 16.8154 40.0004 14.6203 40.0004 11.9126C40.0004 9.20483 37.8057 7.00977 35.0983 7.00977C32.391 7.00977 30.1963 9.20483 30.1963 11.9126C30.1963 14.6203 32.391 16.8154 35.0983 16.8154Z"
      />
    </svg>
  )
}