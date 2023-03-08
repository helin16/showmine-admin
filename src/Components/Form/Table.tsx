import {Table as AntdTable, TableProps} from 'antd';

type iTable = TableProps<any>;
const Table = ({className, ...props}: iTable) => {
  return <AntdTable {...props} className={`app-Table ${className || ''}`} />;
};

export default Table;
