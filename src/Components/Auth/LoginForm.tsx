import React, { useState } from 'react'
import AuthService from '../../Services/AuthService'
import { BACK_END_URL, FORGOT_PASSWORD_URL } from '../../UrlMap'
import InputBox from '../Form/InputBox'
import InputPassword from '../Form/InputPassword'
import Form from '../Form/Form'
import FormItem from '../Form/FormItem'
import Button from '../Form/Button'
import Row from '../Form/Row'
import Col from '../Form/Col'
import { LockOutlined, LoginOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import IError from '../../Types/IError'
import Alert from '../Form/Alert'
import Utils from '../../Services/Utils'
import translate from '../../i18n/translate'

type iLoginForm = {
  className?: string
}
type ILoginFormState = {
  signing: boolean
  signingErr: IError
  signingSuccessFully: boolean
}

export const initState: ILoginFormState = {
  signing: false,
  signingErr: { message: '', errors: [] },
  signingSuccessFully: false,
}
/**
 * login form
 */
const LoginForm = ({ className }: iLoginForm) => {
  const [state, setState] = useState({ ...initState, userToken: '' })
  const navigate = useNavigate()
  /**
   * form validation success
   * @param values
   */
  const onFinish = (values: any): void => {
    // eslint-disable-line
    setState({
      ...state,
      signing: true,
      signingErr: initState.signingErr,
    })
    AuthService.login(values.email, values.password)
      .then((res) => {
        setState({
          ...state,
          userToken: res.token,
          signing: false,
        })
      })
      .catch((err) => {
        setState({
          ...state,
          signingErr: { message: Utils.getErrorMessage(err), errors: err.response?.data?.errors || [] },
          signing: false,
        })
      })
  }

  if (state.userToken !== '') {
    AuthService.setLocalAuthToken(state.userToken)
    navigate(BACK_END_URL);
    return null
  }
  return (
    <Form layout='vertical' name='login form' onFinish={onFinish} size='large' className={className}>
      <FormItem
        label='Email'
        name='email'
        rules={[
          {
            required: true,
            message: 'Please input your email!',
          },
          {
            type: 'email',
            message: 'Please provide an valid email address.',
          },
        ]}
      >
        <InputBox placeholder='Email' prefix={<UserOutlined />} />
      </FormItem>

      <FormItem
        label='Password'
        name='password'
        rules={[
          {
            required: true,
            message: 'Please input your password!',
          },
        ]}
      >
        <InputPassword placeholder='password' prefix={<LockOutlined />} />
      </FormItem>

      {state.signingErr.message !== '' ? (
        <FormItem>
          <Alert message={state.signingErr.message} description={state.signingErr.errors.join(' ')} type='error' />
        </FormItem>
      ) : null}

      <FormItem>
        <Row gutter={8} align={'bottom'}>
          <Col xs={{ span: 24, order: 2 }} sm={{ span: 16, order: 1 }}>
            <Button href={FORGOT_PASSWORD_URL} type={'link'}>
              {translate('forgot-password')}
            </Button>
          </Col>
          <Col xs={{ span: 24, order: 1 }} sm={{ span: 8, order: 2 }} style={{ textAlign: 'right' }}>
            <Button type='primary' htmlType='submit' loading={state.signing === true} block>
              <LoginOutlined />
              Login
            </Button>
          </Col>
        </Row>
      </FormItem>
    </Form>
  )
}

export default LoginForm;
