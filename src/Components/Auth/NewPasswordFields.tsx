import React from 'react'
import { LockOutlined } from '@ant-design/icons'
import { useIntl } from 'react-intl'
import { MIN_PASSWORD_LENGTH } from '../../Constants'
import FormItem from '../Form/FormItem'
import InputPassword from '../Form/InputPassword'

const NewPasswordFields = () => {
  const intl = useIntl()
  const newPassword = intl.formatMessage({ id: 'new-password' })
  const confirmPassword = intl.formatMessage({ id: 'confirm-password' })
  const required = { required: true, message: intl.formatMessage({ id: 'password-too-short' }) }
  return (
    <>
      <FormItem
        label={newPassword}
        name='password'
        // Trimmed, because the API trims before it checks the length.
        rules={[{ ...required, min: MIN_PASSWORD_LENGTH, transform: (value) => `${value || ''}`.trim() }]}
      >
        <InputPassword placeholder={newPassword} prefix={<LockOutlined />} autoComplete='new-password' />
      </FormItem>
      <FormItem
        label={confirmPassword}
        name='confirmPassword'
        dependencies={['password']}
        rules={[
          required,
          ({ getFieldValue }) => ({
            validator: (_rule, value) =>
              !value || value === getFieldValue('password')
                ? Promise.resolve()
                : Promise.reject(new Error(intl.formatMessage({ id: 'confirm-password-diff' }))),
          }),
        ]}
      >
        <InputPassword placeholder={confirmPassword} prefix={<LockOutlined />} autoComplete='new-password' />
      </FormItem>
    </>
  )
}

export default NewPasswordFields
