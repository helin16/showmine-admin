import React, { MouseEvent, useEffect, useState } from 'react'
import IChannel from '../../../Types/Channel/IChannel'
import ChannelIcon from '../ChannelIcon'
import ICompany from '../../../Types/Company/ICompany'
import translate from '../../../i18n/translate'
import ChannelService from '../../../Services/ChannelService'
import message from '../../Form/message'
import { BoxTitleDiv, FormInputWrapper } from '../../../Styles/AppWrapper'
import InlineInput from '../../Form/InlineInput'
import Space from '../../Form/Space'
import Typography from '../../Form/Typography'
import Button from '../../Form/Button'
import Icons from '../../Icons'

type iData = {
  name: string
  type: string
  credential: any
  valid: number
}
const initialData: iData = {
  name: '',
  type: '',
  credential: {},
  valid: 1,
}
type iState = {
  channel?: IChannel
  saving: boolean
  data: iData
  error: { [key: string]: string }
}
const initialState: iState = {
  saving: false,
  data: initialData,
  error: {},
}

type iRedirectChannelEditor = {
  channel: IChannel
  onSaved?: (saved: IChannel) => void;
  onCancel?: () => void;
}
const RedirectChannelEditor = ({ channel, onSaved, onCancel }: iRedirectChannelEditor) => {
  return null
  // const [state, setState] = useState(initialState);
  //
  // useEffect(() => {
  //   if (!company || !company.id || company.id === '') return;
  //
  //   setState((s) => ({
  //     ...s,
  //     channel,
  //     company,
  //     data: {
  //       ...s.data,
  //       type: channel.type,
  //       name: channel.name,
  //       company_id: (company.id ? company.id : ''),
  //     },
  //   }));
  // }, [channel, company]);
  //
  // const handleDataChanged = (fieldName: string, newValue: string, isRequired: boolean) => {
  //   if (isRequired === true && newValue === '') {
  //     state.error[fieldName] = fieldName + translate('is-required');
  //   } else {
  //     delete state.error[fieldName];
  //   }
  //   setState({
  //     ...state,
  //     data: {
  //       ...state.data,
  //       [fieldName]: newValue,
  //     },
  //   });
  // };
  //
  // const preCheck = () => {
  //   handleDataChanged(translate('name'), state.data.name, true);
  // };
  //
  // const handleClicked = () => {
  //   if (!state.channel || !state.company || !state.company.id || state.company.id === '') return;
  //   preCheck();
  //   if (Object.keys(state.error).length > 0) {
  //     return;
  //   }
  //   setState({
  //     ...state,
  //     saving: true,
  //   });
  //   const saveFunc = (!state.channel.id || state.channel.id === '')
  //     ? ChannelService.createChannel(state.data) : ChannelService.updateChannel(state.channel.id, state.data);
  //
  //   saveFunc
  //     .then((res) => {
  //       setState({
  //         ...state,
  //         channel: res.data,
  //         saving: false,
  //       });
  //       message.success('Channel connected successfully.');
  //       window.location = res.data.url;
  //       if (typeof (onSaved) === 'function') {
  //         onSaved(res.data);
  //       }
  //     })
  //     .catch((err) => {
  //       message.error(`Error when connecting: ${err.response.data.message}`);
  //       setState({
  //         ...state,
  //         saving: false,
  //       });
  //     });
  // };
  //
  // const getInputField = (
  //   fieldName: string, label: string, prefix: React.ReactNode, value: string,
  //   placeholder: string, type: string, isRequired: boolean, onChange: Function,
  // ) => (
  //     <FormInputWrapper className={fieldName in state.error ? 'danger' : '' }>
  //       <BoxTitleDiv>
  //         {label}
  //         {isRequired === true ? <Typography.Text type={'danger'}>*</Typography.Text> : null}
  //       </BoxTitleDiv>
  //       <InlineInput
  //         className={'input-wrapper'}
  //         allowClear
  //         type={type}
  //         prefix={prefix}
  //         value={value}
  //         onChange={onChange}
  //         placeholder={placeholder}
  //       />
  //       {fieldName in state.error ? (
  //         <Typography.Text type={'danger'}>{state.error[fieldName]}</Typography.Text>
  //       ) : null}
  //     </FormInputWrapper>
  // );
  //
  // return (
  //   <div>
  //     {getInputField('name', translate('name-channel', { name: channel.type }),
  //       (<ChannelIcon channel={channel}/>), state.data.name,
  //       translate('name-type', { type: channel.type }),
  //       'text', true,
  //       (newValue: string) => handleDataChanged('name', newValue, true))}
  //
  //     <FormInputWrapper style={{ textAlign: 'right' }}>
  //       <Space>
  //         {typeof (onCancel) === 'function' ? (
  //           <Button type={'link'} onClick={(e: MouseEvent) => { onCancel(e); }}>{translate('cancel')}</Button>
  //         ) : null}
  //         <Button type={'primary'} icon={<Icons.ApiOutlined />} onClick={handleClicked} loading={state.saving}>
  //           {translate('connect')}
  //         </Button>
  //       </Space>
  //     </FormInputWrapper>
  //   </div>
  // );
}

export default RedirectChannelEditor
