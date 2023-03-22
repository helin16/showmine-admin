import { List as AntdList } from 'antd'
import { ListItemMetaProps, ListItemProps, ListProps } from 'antd/es/list'

type iList = ListProps<any>
const List = ({ className, ...props }: iList) => {
  return <AntdList {...props} className={`app-List ${className || ''}`} />
}

type iListItem = ListItemProps
export const ListItem = (props: iListItem) => {
  return <AntdList.Item {...props} />
}

type iListItemMeta = ListItemMetaProps
export const ListItemMeta = (props: iListItemMeta) => {
  return <AntdList.Item.Meta {...props} />
}

export default List
