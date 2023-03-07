import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Input } from 'antd';
import { InlineInputDiv as DefaultInlineInputDiv } from '../../Styles/AppWrapper';
import IKeyboardEvent from '../../Types/IKeyboardEvent';

const InlineInputDiv = styled(DefaultInlineInputDiv)`
  input {
    background: transparent;
    box-shadow: none;
  }
  .ant-input-affix-wrapper {
    box-shadow: none;
    :not(.ant-input-affix-wrapper-focused)  {
      .ant-input-clear-icon {
        color: transparent;
      }
    }
  }
  .inline-input {
    border: none;
    padding: 0px;
    background: transparent;
    box-shadow: none;
  }
  .ant-input-prefix {
    margin-right: 8px;
  }
`;

type iState = {
  value: string,
}
const initialState: iState = {
  value: '',
};
export default ({ value, onChange, className, ...props }: React.ComponentProps<any>) => { // eslint-disable-line
  const [state, setState] = useState(initialState);

  useEffect(() => {
    setState((s) => ({
      ...s,
      value,
    }));
  }, [value]);

  const valueChanged = (e: IKeyboardEvent<HTMLInputElement>) => {
    setState({
      ...state,
      value: e.target.value,
    });
  };

  const onBlur = () => {
    if (typeof (onChange) === 'function' && state.value !== value) {
      onChange(state.value);
    }
  };

  return (
    <InlineInputDiv className={className}>
      <Input
        {...props}
        className={'inline-input'}
        value={state.value}
        onChange={valueChanged}
        onBlur={onBlur}
        onPressEnter={(e: IKeyboardEvent<HTMLInputElement>) => e.target.blur()}
      />
    </InlineInputDiv>
  );
};
