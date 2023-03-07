import {Form as AntdForm, FormProps} from 'antd';

type iForm = FormProps;
const Form = ({className, ...props}: iForm) => {
  // @ts-ignore
  return <AntdForm {...props} className={`app-form ${className || ''}`} />
}

export default Form;
