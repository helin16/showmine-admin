import React from 'react';
import styled from 'styled-components';
import { Layout } from 'antd';

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
`;

const ContentWrapper = styled.div`
  width: 400px;
  margin: 10px auto;
`;

export default ({ children }: React.ComponentProps<any>) => ( // eslint-disable-line
    <Wrapper>
      <Layout>
        <Layout.Content style={{ minHeight: '100vh', height: '100%' }}>
          <ContentWrapper>
            { children }
          </ContentWrapper>
        </Layout.Content>
      </Layout>
    </Wrapper>
);
