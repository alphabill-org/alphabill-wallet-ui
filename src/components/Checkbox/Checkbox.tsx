import React from "react";

export interface ICheckboxProps {
  label: String;
  isChecked: boolean;
  onChange: () => void;
}

export default function Checkbox(props: ICheckboxProps): JSX.Element {
  return (
    <label className="checkbox">
      {props.label}
      <input
        type="checkbox"
        checked={props.isChecked}
        onChange={props.onChange}
      />
      <span className="checkmark"></span>
    </label>
  );
}
