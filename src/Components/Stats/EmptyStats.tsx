import React from 'react';
import { Empty } from 'antd';
import styled from 'styled-components';

const Wrapper = styled.div`
  padding: 20px;
`;
const TitleDiv = styled.div`
  text-align: center;
  font-size: 18px;
  color: #000;
  margin-bottom: 20px;
`;
const EmptyStats = ({ title }: {title: string}) => (
    <Wrapper>
      <TitleDiv>{title}</TitleDiv>
      <Empty />
    </Wrapper>
);

export default EmptyStats;
