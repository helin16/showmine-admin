import { Radio as AntdRadio, RadioGroupProps, RadioProps } from 'antd'
import { RadioButtonProps } from 'antd/es/radio/radioButton'

type iRadio = RadioProps
const Radio = ({ className, ...props }: iRadio) => {
  return <AntdRadio {...props} className={`app-Radio ${className || ''}`} />
}

type iRadioGroup = RadioGroupProps
export const RadioGroup = ({ className, ...props }: iRadioGroup) => {
  return <AntdRadio.Group {...props} className={`app-Radio ${className || ''}`} />
}

type iRadioButton = RadioButtonProps
export const RadioButton = ({ className, ...props }: iRadioButton) => {
  return <AntdRadio.Button {...props} className={`app-Radio ${className || ''}`} />
}

export default Radio
