import {Switch as AntdSwitch, SwitchProps} from 'antd';

type iSwitch = SwitchProps;
const Switch = ({className, ...props}: iSwitch) => {
  return <AntdSwitch {...props} className={`app-Switch ${className || ''}`} />;
};

export default Switch;
