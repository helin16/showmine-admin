import React from 'react';
import IError from '../../Types/IError';
import Alert from '../Form/Alert';

const InlineError = (props: { error: IError | undefined}) => {
  if (props.error === undefined) {
    return (<></>);
  }

  const { message } = props.error;

  return (
    <Alert
      {...props}
      type="error"
      message={message}
    />
  );
};

export default InlineError;
