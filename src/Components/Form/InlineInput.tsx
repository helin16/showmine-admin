import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Input } from 'antd'
import { InlineInputDiv as DefaultInlineInputDiv } from '../../Styles/AppWrapper'
import IKeyboardEvent from '../../Types/IKeyboardEvent'

const InlineInputDiv = styled(DefaultInlineInputDiv)`
  input {
    background: transparent;
    box-shadow: none;
  }
  .ant-input-affix-wrapper {
    box-shadow: none;
    :not(.ant-input-affix-wrapper-focused) {
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
`

type iState = {
  value: string
}
const initialState: iState = {
  value: '',
}
// eslint-disable-next-line react/prop-types
const InlineInput = ({ value, onChange, className, onPressEnter, ...props }: React.ComponentProps<any>) => {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    setState((s) => ({
      ...s,
      value,
    }))
  }, [value])

  const valueChanged = (e: IKeyboardEvent<HTMLInputElement>) => {
    setState({
      ...state,
      value: e.target.value,
    })
  }

  const onBlur = () => {
    if (typeof onChange === 'function' && state.value !== value) {
      onChange(state.value)
    }
  }

  return (
    <InlineInputDiv className={className}>
      <Input
        {...props}
        className={'inline-input'}
        value={state.value}
        onChange={valueChanged}
        onBlur={onBlur}
        onPressEnter={(e: IKeyboardEvent<HTMLInputElement>) => (onPressEnter ? onPressEnter(e) : e.target.blur())}
      />
    </InlineInputDiv>
  )
}

export default InlineInput;
