import { Spin as AntdSpin, SpinProps } from 'antd'

type iSpin = SpinProps
// antd now applies the app's large componentSize to spinners, which enlarges them.
const Spin = ({ className, size = 'medium', ...props }: iSpin) => {
  return <AntdSpin {...props} size={size} className={`app-Spin ${className || ''}`} />
}

export default Spin
