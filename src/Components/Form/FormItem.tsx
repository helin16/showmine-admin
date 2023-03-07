import {Form, FormItemProps} from 'antd';

type iFormItem = FormItemProps;
const FormItem = ({className, ...props}: iFormItem) => {
  return (
    <Form.Item {...props} className={`app-form-item ${className || ''}`} />
  )
}

export default FormItem;
