import { ICProps } from "./ICTypes"

export const ICCopy = ({className} : ICProps) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24"
      className={className} 
    >
      <path 
        fill-rule="evenodd" 
        clip-rule="evenodd" 
        d="M9.46154 5.53846C9.46154 4.13651 10.598 3 12 3H18.4615C19.8635 3 21 4.13651 21 5.53846V12C21 13.402 19.8635 14.5385 18.4615 14.5385H17.0769C16.6946 14.5385 16.3846 14.2285 16.3846 13.8462C16.3846 13.4638 16.6946 13.1538 17.0769 13.1538H18.4615C19.0988 13.1538 19.6154 12.6373 19.6154 12V5.53846C19.6154 4.90121 19.0988 4.38462 18.4615 4.38462H12C11.3627 4.38462 10.8462 4.90121 10.8462 5.53846V6.92308C10.8462 7.30543 10.5362 7.61538 10.1538 7.61538C9.7715 7.61538 9.46154 7.30543 9.46154 6.92308V5.53846ZM3 12C3 10.598 4.13651 9.46154 5.53846 9.46154H12C13.402 9.46154 14.5385 10.598 14.5385 12V18.4615C14.5385 19.8635 13.402 21 12 21H5.53846C4.13651 21 3 19.8635 3 18.4615V12ZM5.53846 10.8462C4.90121 10.8462 4.38462 11.3627 4.38462 12V18.4615C4.38462 19.0988 4.90121 19.6154 5.53846 19.6154H12C12.6373 19.6154 13.1538 19.0988 13.1538 18.4615V12C13.1538 11.3627 12.6373 10.8462 12 10.8462H5.53846Z"
      />
    </svg>
  )
}