import React from 'react'
import styled from 'styled-components'
import Empty from '../Form/Empty'

const Wrapper = styled.div`
  padding: 20px;
`
const TitleDiv = styled.div`
  text-align: center;
  font-size: 18px;
  color: #000;
  margin-bottom: 20px;
`
const EmptyStats = ({ title }: { title: string }) => (
  <Wrapper>
    <TitleDiv>{title}</TitleDiv>
    <Empty />
  </Wrapper>
)

export default EmptyStats
