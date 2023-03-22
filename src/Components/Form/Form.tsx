import { Form as AntdForm, FormProps } from 'antd'
import {ReactNode} from 'react';

type iForm = FormProps & { children: ReactNode};
const Form = ({ className, ...props }: iForm) => {
  return <AntdForm {...props} className={`app-form ${className || ''}`} />
}

export default Form
