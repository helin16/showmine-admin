import {Alert as AntdAlert, AlertProps} from 'antd';

type iAlert = AlertProps;

const Alert = ({className, ...props}: iAlert) => {
  return <AntdAlert {...props} className={`app-alert ${className || ''}`} />;
}

export default Alert;
