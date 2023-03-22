import { Input } from 'antd'
import { SearchProps } from 'antd/es/input'

type iSearch = SearchProps
const Search = ({ className, ...props }: iSearch) => {
  return <Input.Search {...props} className={`app-search ${className || ''}`} />
}

export default Search
