import { ICProps } from "./ICTypes";

export const ICHome = ({ className }: ICProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M11.5485 3.18055C11.807 2.93982 12.193 2.93982 12.4515 3.18055L19.7658 9.99136C19.9146 10.1299 20 10.3301 20 10.5405L20 20.2703C20 20.4638 19.9278 20.6494 19.7992 20.7863C19.6706 20.9231 19.4961 21 19.3143 21H14.7429C14.3642 21 14.0571 20.6733 14.0571 20.2703V16.3784C14.0571 15.7978 13.8404 15.2409 13.4546 14.8304C13.0688 14.4198 12.5456 14.1892 12 14.1892C11.4544 14.1892 10.9312 14.4198 10.5454 14.8304C10.1596 15.2409 9.94286 15.7978 9.94286 16.3784V20.2703C9.94286 20.6733 9.63586 21 9.25715 21H4.68572C4.30701 21 4 20.6733 4 20.2703L4 10.5405C4 10.3301 4.08536 10.1299 4.23417 9.99136L11.5485 3.18055ZM5.37143 10.8717L5.37143 19.5405H8.57143V16.3784C8.57143 15.4107 8.93265 14.4826 9.57564 13.7984C10.2186 13.1141 11.0907 12.7297 12 12.7297C12.9093 12.7297 13.7814 13.1141 14.4244 13.7984C15.0674 14.4826 15.4286 15.4107 15.4286 16.3784V19.5405H18.6286L18.6286 10.8717L12 4.69937L5.37143 10.8717Z"
      />
    </svg>
  );
};
