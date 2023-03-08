import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { LockOutlined } from '@ant-design/icons';
import {
  Typography, Button, Row, Col, message,
} from 'antd';
import { useIntl } from 'react-intl';
import InlineInput from '../Form/InlineInput';
import {BoxTitleDiv, FormInputWrapper, listGutter} from '../../Styles/AppWrapper';

const ConfirmPasswordDiv = styled.div`
`;

const directionHorizontal = 'horizontal';

const initialState = {
  password: '',
  confirmPassword: '',
  isHorizontal: false,
};
const PasswordConfirm =  ({
  onConfirm, btnText, labelText, direction, ...props
}: {
  onConfirm: Function,
  btnText?: React.ComponentProps<any>,  // eslint-disable-line
  labelText?: React.ComponentProps<any>, // eslint-disable-line
  direction?: string,
}) => {
  const [state, setState] = useState(initialState);
  const intl = useIntl();

  useEffect(() => {
    setState((s) => ({
      ...s,
      isHorizontal: direction === directionHorizontal,
    }));
  }, [direction]);

  const onPasswordChanged = (newValue: string) => {
    const newState = {
      ...state,
      password: newValue,
    };
    if (newValue === '') {
      newState.confirmPassword = '';
    }
    setState(newState);
  };

  const onConfirmPasswordChanged = (newValue: string) => {
    setState({
      ...state,
      confirmPassword: newValue,
    });
  };

  const isDiff = () => (state.password !== state.confirmPassword);

  const confirmPassword = () => {
    if (isDiff()) {
      message.error(intl.formatMessage({ id: 'confirm-password-diff' }));
      return;
    }
    setState({
      ...state,
      password: '',
      confirmPassword: '',
    });
    if (typeof (onConfirm) === 'function') {
      onConfirm(state.password, state.confirmPassword);
    }
  };

  const getConfirmPassword = () => {
    if (state.password === '') return null;
    return (
      <>
        <Col md={state.isHorizontal !== true ? 24 : 9}>
          <FormInputWrapper>
            <BoxTitleDiv className={isDiff() ? 'danger' : ''}>{intl.formatMessage({ id: 'confirm' })} {labelText || 'Password'}</BoxTitleDiv>
            <InlineInput
              allowClear
              type={'password'}
              className={isDiff() ? 'input-wrapper danger' : ''}
              value={state.confirmPassword}
              onChange={(newValue: string) => onConfirmPasswordChanged(newValue)}
              prefix={<LockOutlined />}
              placeholder={intl.formatMessage({ id: 'confirm-password' })}
            />
            {!isDiff() ? null : (
              <Typography.Text type={'danger'}>{intl.formatMessage({ id: 'confirm-password-diff' })}</Typography.Text>
            )}
          </FormInputWrapper>
        </Col>
        <Col md={state.isHorizontal !== true ? 24 : 6}>
          <FormInputWrapper style={{ textAlign: (state.isHorizontal === true ? 'right' : 'left') }}>
            <BoxTitleDiv style={{ display: (state.isHorizontal === true ? 'block' : 'none') }}>&nbsp;</BoxTitleDiv>
            <Button type={'primary'} disabled={isDiff()} onClick={confirmPassword}>
              {btnText || 'Confirm'}
            </Button>
          </FormInputWrapper>
        </Col>
      </>
    );
  };

  return (
    <ConfirmPasswordDiv className={state.isHorizontal === true ? 'horizontal' : ''} {...props}>
      <Row gutter={listGutter}>
        <Col md={(state.password === '' || state.isHorizontal !== true) ? 24 : 9}>
          <FormInputWrapper>
            <BoxTitleDiv>{labelText || intl.formatMessage({ id: 'password' }) }</BoxTitleDiv>
            <InlineInput
              allowClear
              type={'password'}
              value={state.password}
              prefix={<LockOutlined />}
              onChange={(newValue: string) => onPasswordChanged(newValue)}
              placeholder={intl.formatMessage({ id: 'password' })}
            />
          </FormInputWrapper>
        </Col>
        {getConfirmPassword()}
      </Row>
    </ConfirmPasswordDiv>
  );
};

export default PasswordConfirm;
