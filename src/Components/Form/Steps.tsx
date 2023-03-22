import { Steps as AntdSteps, StepsProps } from 'antd'

type iSteps = StepsProps
const Steps = ({ className, ...props }: iSteps) => {
  return <AntdSteps {...props} className={`app-Steps ${className || ''}`} />
}

export default Steps
