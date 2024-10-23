import { ICProps } from "./ICTypes"

export const ICDown = ({className} : ICProps) => {
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
        d="M6.22922 8.23657C6.53485 7.92114 7.03037 7.92114 7.336 8.23657L12 13.0501L16.664 8.23657C16.9696 7.92114 17.4652 7.92114 17.7708 8.23657C18.0764 8.55199 18.0764 9.06339 17.7708 9.37882L12.5534 14.7634C12.2478 15.0789 11.7522 15.0789 11.4466 14.7634L6.22922 9.37882C5.92359 9.06339 5.92359 8.55199 6.22922 8.23657Z"
      />
    </svg>
  )
}