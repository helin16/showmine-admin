import { Col as AntdCol, ColProps } from 'antd'

type iRow = ColProps
const Col = ({ className, ...props }: iRow) => {
  return <AntdCol {...props} className={`app-col ${className || ''}`} />
}

export default Col
