import {Result as AntdResult, ResultProps} from 'antd';

export type iResult = ResultProps;
const Result = ({className, ...props}: iResult) => {
  return (
    <AntdResult {...props} className={`app-result ${className || ''}`} />
  )
}

export default Result;
