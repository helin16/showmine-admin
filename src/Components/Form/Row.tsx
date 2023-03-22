import { Row as AntdRow, RowProps } from 'antd'

type iRow = RowProps
const Row = ({ className, ...props }: iRow) => {
  return <AntdRow {...props} className={`app-row ${className || ''}`} />
}

export default Row
