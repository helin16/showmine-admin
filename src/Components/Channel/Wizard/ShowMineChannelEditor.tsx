import React, { MouseEvent, useEffect, useState } from 'react';
import IChannel from '../../../Types/Channel/IChannel';
import ChannelIcon from '../ChannelIcon';
import ChannelService from '../../../Services/ChannelService';
import ICompany from '../../../Types/Company/ICompany';
import {BoxTitleDiv, FormInputWrapper} from '../../../Styles/AppWrapper';
import InlineInput from '../../Form/InlineInput';
import Typography from '../../Form/Typography';
import Space from '../../Form/Space';
import Button from '../../Form/Button';
import Icons from '../../Icons';
import message from '../../Form/message';

type iData = {
  name: string,
  company_id: string, // eslint-disable-line
  type: string,
  credential: {}
}
const initialData: iData = {
  name: '',
  type: '',
  company_id: '', // eslint-disable-line
  credential: {},
};
type iState = {
  channel?: IChannel,
  company?: ICompany,
  saving: boolean,
  data: iData,
  error: { [key: string]: string },
}
const initialState: iState = {
  saving: false,
  data: initialData,
  error: {},
};

type iShowMineChannelEditor = {
  channel: IChannel, company?: ICompany, onSaved?: Function, onCancel?: Function,
}
const ShowMineChannelEditor = ({
  channel, company, onSaved, onCancel,
}: iShowMineChannelEditor) => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    if (!company || !company.id || company.id === '') return;

    setState((s) => ({
      ...s,
      channel,
      company,
      data: {
        ...s.data,
        type: channel.type,
        name: channel.name,
        company_id: (company.id ? company.id : ''),
      },
    }));
  }, [channel, company]);

  const handleDataChanged = (fieldName: string, newValue: string, isRequired: boolean) => {
    if (isRequired === true && newValue === '') {
      state.error[fieldName] = `${fieldName} is required.`;
    } else {
      delete state.error[fieldName];
    }
    setState({
      ...state,
      data: {
        ...state.data,
        [fieldName]: newValue,
      },
    });
  };

  const preCheck = () => {
    handleDataChanged('name', state.data.name, true);
  };

  const handleClicked = () => {
    if (!state.channel || !state.company || !state.company.id || state.company.id === '') return;
    preCheck();
    if (Object.keys(state.error).length > 0) {
      return;
    }
    setState({
      ...state,
      saving: true,
    });
    const saveFunc = (!state.channel.id || state.channel.id === '')
      ? ChannelService.createChannel(state.data) : ChannelService.updateChannel(state.channel.id, state.data);

    saveFunc
      .then((res) => {
        setState({
          ...state,
          channel: res.data,
          saving: false,
        });
        message.success('Channel connected successfully.');
        if (typeof (onSaved) === 'function') {
          onSaved(res.data);
        }
      })
      .catch((err) => {
        message.error(`Error when connecting: ${err.response.data.message}`);
        setState({
          ...state,
          saving: false,
        });
      });
  };

  const getInputField = (
    fieldName: string, label: string, prefix: React.ReactNode, value: string,
    placeholder: string, type: string, isRequired: boolean, onChange: Function,
  ) => (
      <FormInputWrapper className={fieldName in state.error ? 'danger' : '' }>
        <BoxTitleDiv>
          {label}
          {isRequired === true ? <Typography.Text type={'danger'}>*</Typography.Text> : null}
        </BoxTitleDiv>
        <InlineInput
          className={'input-wrapper'}
          allowClear
          type={type}
          prefix={prefix}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        {fieldName in state.error ? (
          <Typography.Text type={'danger'}>{state.error[fieldName]}</Typography.Text>
        ) : null}
      </FormInputWrapper>
  );

  return (
    <div>
      {getInputField('name', `The name of your ${channel.type} channel`,
        (<ChannelIcon channel={channel}/>), state.data.name,
        `Your own name for your ${channel.type} channel.`,
        'text', true,
        (newValue: string) => handleDataChanged('name', newValue, true))}

      <FormInputWrapper style={{ textAlign: 'right' }}>
        <Space>
          {typeof (onCancel) === 'function' ? (
            <Button type={'link'} onClick={(e: MouseEvent) => { onCancel(e); }}>Cancel</Button>
          ) : null}
          <Button type={'primary'} icon={<Icons.ApiOutlined />} onClick={handleClicked} loading={state.saving}>
            Connect
          </Button>
        </Space>
      </FormInputWrapper>
    </div>
  );
};


export default ShowMineChannelEditor;
