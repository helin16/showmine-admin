import {Spin as AntdSpin, SpinProps} from 'antd';

type iSpin = SpinProps;
const Spin = ({className, ...props}: iSpin) => {
  return <AntdSpin {...props} className={`app-Spin ${className || ''}`} />;
};

export default Spin;
