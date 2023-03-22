import { Input, InputProps } from 'antd'
import React from 'react'

type iInputBox = InputProps
const InputBox = ({ className, ...props }: iInputBox) => {
  return <Input {...props} className={`app-input-box ${className || ''}`} />
}

export default InputBox
