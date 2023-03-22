import React, { useState } from 'react'
import InlineInput from '../Form/InlineInput'
import Utils from '../../Services/Utils'
import AuthService from '../../Services/AuthService'
import { LOGIN_URL } from '../../UrlMap'
import { BoxTitleDiv, FormInputWrapper } from '../../Styles/AppWrapper'
import Icons from '../Icons'
import Button from '../Form/Button'
import message from '../Form/message'
import Result from '../Form/Result'
import Typography from '../Form/Typography'

type iState = {
  submitting: boolean
  submittedSuccessfully: boolean
  email: string
  error?: string
}

const initialState: iState = {
  submitting: false,
  submittedSuccessfully: false,
  email: '',
}

const RetrievePasswordForm = () => {
  return null
  // const [state, setState] = useState(initialState);
  //
  // const handleValueChanged = (newValue: string) => {
  //   if (newValue === '') {
  //     setState({
  //       ...state,
  //       email: newValue,
  //       error: 'Email address is required.',
  //     });
  //     return null;
  //   }
  //   if (Utils.validateEmailFormat(newValue) !== true) {
  //     setState({
  //       ...state,
  //       email: newValue,
  //       error: 'Please provide an valid email address.',
  //     });
  //     return null;
  //   }
  //   setState({
  //     ...state,
  //     email: newValue,
  //     error: undefined,
  //   });
  //   return null;
  // };
  //
  // const submit = () => {
  //   handleValueChanged(state.email);
  //   if (state.error && state.error !== '') {
  //     return null;
  //   }
  //   setState({
  //     ...state,
  //     submitting: true,
  //   });
  //   AuthService.retrievePassword(state.email)
  //     .then((res) => {
  //       setState({
  //         ...initialState,
  //         submittedSuccessfully: res.data.success,
  //       });
  //     })
  //     .catch((err) => {
  //       message.error(`Error when retrieve password ${err.response.data.message}`);
  //       setState(initialState);
  //     });
  //   return null;
  // };
  //
  // const getForm = () => (
  //     <>
  //       <h1>Retrieve Password</h1>
  //       <Typography.Paragraph>
  //         After submit, an email containing a temporary link will be sent this provided email address.
  //       </Typography.Paragraph>
  //       <FormInputWrapper>
  //         <BoxTitleDiv>Please provide your registered email address </BoxTitleDiv>
  //         <InlineInput className={`input-wrapper ${!state.error ? '' : 'danger'}`}
  //            allowClear
  //            prefix={<Icons.MailOutlined />}
  //            onChange={handleValueChanged}
  //            placeholder={'Type in your email address here...'}
  //            value={state.email}/>
  //         {!state.error ? null : (
  //           <Typography.Text type={'danger'}>{state.error}</Typography.Text>
  //         )}
  //       </FormInputWrapper>
  //       <FormInputWrapper>
  //         <Button type={'primary'} block icon={<Icons.SendOutlined />} onClick={submit} loading={state.submitting}>
  //           Submit
  //         </Button>
  //       </FormInputWrapper>
  //       <FormInputWrapper>
  //         <Button href={LOGIN_URL} type={'link'}>Don't worry, I will try to login again.</Button>
  //       </FormInputWrapper>
  //     </>
  // );
  //
  // return (
  //   <div>
  //     {state.submittedSuccessfully !== true ? getForm() : (
  //       <Result
  //         status="success"
  //         title="Requested Successfully."
  //         subTitle="Reset Password Email has been sent to this provided email address, please check your mail box."
  //         extra={[
  //           <Button href={LOGIN_URL} type={'link'}>Go back to login now</Button>
  //         ]}
  //       />
  //     )}
  //   </div>
  // );
}

export default RetrievePasswordForm
