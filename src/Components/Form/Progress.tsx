import {Progress as AntdProgress, ProgressProps} from 'antd';

type iProgress = ProgressProps;
const Progress = ({className, ...props}: iProgress) => {
  return <AntdProgress {...props} className={`app-progress ${className || ''}`} />;
};

export default Progress;
