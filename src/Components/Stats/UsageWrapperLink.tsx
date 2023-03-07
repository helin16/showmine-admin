import React from 'react';
import Tooltip from '../Form/Tooltip';
import {Link} from 'react-router-dom';

const UsageWrapperLink = ({
  currentValue, planValue, url, children, ...props
}:
  React.ComponentProps<any>) => { // eslint-disable-line

  if (!children || children === null) {
    return null;
  }
  if (!url) {
    return children;
  }
  return (
    <Tooltip
      {...props}
      title={
        `Current Usage: ${currentValue}, 
            Your Plan: ${planValue < '0' ? 'Unlimited' : planValue}`
      }
    >
      <Link type={'link'} to={url}>
        {children}
      </Link>
    </Tooltip>
  );
};

export default UsageWrapperLink;
