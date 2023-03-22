import { Affix as AntdAffix, AffixProps } from 'antd'

type iAffix = AffixProps
const Affix = ({ className, ...props }: iAffix) => {
  return <AntdAffix {...props} className={`app-Affix ${className || ''}`} />
}

export default Affix
