import React from 'react';

type props = {
  width?: number
};

const AppLogo =  ({ width }: props) => <img
    src={`/img/logo.png`}
    style={{ width: width || 180, margin: '8px' }}
    alt="Logo"
  />;


export default AppLogo
