import { List as AntdList } from 'antd'
import { ListItemMetaProps, ListItemProps, ListProps } from 'antd/es/list'

type iList = ListProps<any>
// antd now applies the app's large componentSize to lists, which widens their rows.
const List = ({ className, size = 'default', ...props }: iList) => {
  return <AntdList {...props} size={size} className={`app-List ${className || ''}`} />
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
