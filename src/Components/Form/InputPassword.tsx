import { PasswordProps } from 'antd/es/input'
import { Input } from 'antd'

type iInputPassword = PasswordProps
const InputPassword = ({ className, ...props }: iInputPassword) => {
  return <Input.Password {...props} className={`app-input-password-box ${className || ''}`} />
}

export default InputPassword
