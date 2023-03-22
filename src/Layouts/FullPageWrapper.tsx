import React from 'react'
import styled from 'styled-components'
import Layout, { Content } from '../Components/Form/Layout'

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
`

const ContentWrapper = styled.div`
  width: 400px;
  margin: 10px auto;
`

const FullPageWrapper = (
  { children }: React.ComponentProps<any>, // eslint-disable-line
) => (
  <Wrapper>
    <Layout>
      <Content style={{ minHeight: '100vh', height: '100%' }}>
        <ContentWrapper>{children}</ContentWrapper>
      </Content>
    </Layout>
  </Wrapper>
)


export default FullPageWrapper;
