import React from 'react';

import classNames from 'classnames';
import { useField, useFormikContext } from 'formik';
import ReactSelect, { Props } from 'react-select';

export interface IOption {
  label: string;
  value: string;
}

export interface ISelectProps extends Props {
  name: string;
  label: string;
  className?: string;
  error?: string | string[];
}

export default function Select(props: ISelectProps): JSX.Element {
  const { setFieldValue } = useFormikContext();
  const [field] = useField(props.name);

  const handleChange = (option: any): void => {
    setFieldValue(
      field.name,
      props.isMulti
        ? (option as IOption[])?.map((item: IOption) => item?.value)
        : (option as IOption)?.value || ''
    );

    if (props.onChange) {
      props.onChange(props.label, getValue());
    }
  };

  const getValue = () => {
    if (props.options) {
      return props.isMulti
        ? (props.options as IOption[]).filter(
            (option: IOption) => field.value?.indexOf(option.value) >= 0
          )
        : (props.options as IOption[]).find((option: IOption) => option.value === field.value);
    } else {
      return props.isMulti ? [] : ('' as any);
    }
  };

  const className = classNames('select', { 'select--error': props.error }, props.className);

  return (
    <div className={className}>
      {props.label && <label className="select__label">{props.label}</label>}
      <ReactSelect
        className="select__inner"
        placeholder={props.placeholder}
        name={field.name}
        value={getValue()}
        onChange={handleChange}
        options={props.options}
        menuPlacement="auto"
        classNamePrefix="select"
        isSearchable={false}
        components={{ IndicatorSeparator: null }}
        isDisabled={props.isDisabled}
      />
      {props.error && props.error.length > 0 && (
        <span data-testid="select__error" className="select__error">
          {props.error}
        </span>
      )}
    </div>
  );
}
