import React, {useEffect} from 'react';
import styled from 'styled-components';
import {pageMinHeight} from '../Styles/AppWrapper';

const AuthPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  min-height: ${pageMinHeight};
  .row {
    display: flex;
    justify-content: center;
    
    .operations {
      width: 80%;
      .page-box {
        margin: 0 auto;
      }
    }
  }
`;
const AuthPage =  ({ children, description }: {
  children: React.ReactNode, description?: React.ReactNode
}) => {
  useEffect(() => {
    document.body.classList.add('auth-page-body');
    return () => {
      document.body.classList.remove('auth-page-body');
    }
  }, [])

  return (
    <AuthPageWrapper className={'auth-page-wrapper'}>
      <div className={`row ${description ? '' : 'no-description'}`}>
        <div className={'operations col'}>
          <div className={'inner-wrapper'}>
            {children}
          </div>
        </div>
        {!description ? null : (
          <div className={'description col'}>
            <div className={'inner-wrapper'}>
              {description}
            </div>
          </div>
        )}
      </div>
    </AuthPageWrapper>
  );
};

export default AuthPage;
