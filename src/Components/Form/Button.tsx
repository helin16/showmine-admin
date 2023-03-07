import {Button as AntdButton, ButtonProps} from 'antd';

export type iButton = ButtonProps;
const Button = ({className, ...props}: iButton) => {
  return <AntdButton {...props} className={`app-button ${className || ''}`} />
}

export default Button;
