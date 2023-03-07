import React from 'react';

import styled from 'styled-components';

const Wrapper = styled.div`
  background: rgba(255, 255, 255, 0.9);
  width: 80%;
  max-width: 350px;
  min-height: 400px;
  padding: 3rem;
`;

const PageBox = ({ children, className, }: React.ComponentProps<any>) => ( // eslint-disable-line
    <Wrapper className={`page-box ${className || ''}`}>
      {children}
    </Wrapper>
);

export default PageBox;
