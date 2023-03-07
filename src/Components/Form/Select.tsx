import {Select as AntdSelect, SelectProps} from 'antd';

type iSelect = SelectProps;
const Select = ({className, ...props}: iSelect) => {
  return <AntdSelect {...props} className={`app-Select ${className || ''}`} />;
};

export default Select;
