import React, { MouseEvent, useEffect, useState } from 'react';
import IChannel from '../../../Types/Channel/IChannel';
import ChannelIcon from '../ChannelIcon';
import ICompany from '../../../Types/Company/ICompany';
import Utils from '../../../Services/Utils';
import translate from '../../../i18n/translate';
import ChannelService from '../../../Services/ChannelService';
import message from '../../Form/message';
import Typography from '../../Form/Typography';
import {BoxTitleDiv, FormInputWrapper} from '../../../Styles/AppWrapper';
import InlineInput from '../../Form/InlineInput';
import Icons from '../../Icons';
import Row from '../../Form/Row';
import Col from '../../Form/Col';
import Space from '../../Form/Space';
import Button from '../../Form/Button';

type iData = {
  name: string,
  company_id: string, // eslint-disable-line
  type: string,
  credential: {
    wpUrl: string,
    wpUserName: string,
    wpPassword: string,
  }
}
const initialData: iData = {
  name: '',
  type: '',
  company_id: '', // eslint-disable-line
  credential: {
    wpUrl: '',
    wpUserName: '',
    wpPassword: '',
  },
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
type iWordPressChannelEditor = {
  channel: IChannel, company?: ICompany, onSaved?: Function, onCancel?: Function,
}
const WordPressChannelEditor = ({
  channel, company, onSaved, onCancel,
}: iWordPressChannelEditor) => {
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
        credential: channel.credential,
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

  const handleDataCredentialChanged = (fieldName: string, newValue: string, isRequired: boolean) => {
    if (isRequired === true && newValue === '') {
      state.error[fieldName] = `${fieldName} is required.`;
    } else if (fieldName === 'wpUrl' && Utils.validateUrl(newValue) !== true) {
      state.error[fieldName] = 'Please provide a valid url.';
    } else {
      delete state.error[fieldName];
    }
    setState({
      ...state,
      data: {
        ...state.data,
        credential: {
          ...state.data.credential,
          [fieldName]: newValue,
        },
      },
    });
  };

  const preCheck = () => {
    handleDataChanged('name', state.data.name, true);
    handleDataCredentialChanged('wpUrl', state.data.credential.wpUrl, true);
    handleDataCredentialChanged('wpUserName', state.data.credential.wpUserName, true);
    handleDataCredentialChanged('wpPassword', state.data.credential.wpPassword, true);
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
      ? ChannelService.createChannel({
        ...channel,
        ...state.data,
      }) : ChannelService.updateChannel(state.channel.id, {
        ...channel,
        ...state.data,
      });

    saveFunc
      .then((res) => {
        setState({
          ...state,
          channel: res.data,
          saving: false,
        });
        message.success(translate('channel-connected'));
        if (typeof (onSaved) === 'function') {
          onSaved(res.data);
        }
      })
      .catch((err) => {
        message.error(translate('channel-connected-error', { message: err.response.data.message }));
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
      {getInputField('name', translate('name-channel', { name: channel.type }),
        (<ChannelIcon channel={channel}/>), state.data.name,
        translate('name-type', { type: channel.type }),
        'text', true,
        (newValue: string) => handleDataChanged('name', newValue, true))}
      {getInputField('wpUrl', translate('url-type', { type: channel.type }),
        (<Icons.LinkOutlined/>), state.data.credential.wpUrl,
        translate('website-type', { type: channel.type }),
        'text', true,
        (newValue: string) => handleDataCredentialChanged('wpUrl', newValue, true))}
      <Row gutter={16}>
        <Col xs={{ span: 24 }} md={{ span: 12 }}>
          {getInputField('wpUserName', translate('username-type', { type: channel.type }),
            (<Icons.UserOutlined/>), state.data.credential.wpUserName,
            translate('username-type-above', { type: channel.type }),
            'text', true,
            (newValue: string) => handleDataCredentialChanged('wpUserName', newValue, true))}
        </Col>
        <Col xs={{ span: 24 }} md={{ span: 12 }}>
          {getInputField('wpPassword', translate('password-type', { type: channel.type }),
            (<Icons.LockOutlined />), state.data.credential.wpPassword,
            translate('password-type-above', { type: channel.type }),
            'password', true,
            (newValue: string) => handleDataCredentialChanged('wpPassword', newValue, true))}
        </Col>
      </Row>
      <FormInputWrapper style={{ textAlign: 'right' }}>
        <Space>
          {typeof (onCancel) === 'function' ? (
            <Button type={'link'} onClick={(e: MouseEvent) => { onCancel(e); }}>{translate('cancel')}</Button>
          ) : null}
          <Button type={'primary'} icon={<Icons.ApiOutlined />} onClick={handleClicked} loading={state.saving}>
            {translate('connect')}
          </Button>
        </Space>
      </FormInputWrapper>
    </div>
  );
};

export default WordPressChannelEditor;
