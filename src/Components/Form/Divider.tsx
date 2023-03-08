import {Divider as AntdDivider, DividerProps} from 'antd';

type iDivider = DividerProps;
const Divider = ({className, ...props}: iDivider) => {
  return <AntdDivider {...props} className={`app-Divider ${className || ''}`} />;
};

export default Divider;
