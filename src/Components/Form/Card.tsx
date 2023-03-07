import {Card as AntdCard, CardProps} from 'antd';
import styled from 'styled-components';
import {listGutter} from '../../Styles/AppWrapper';

type iCard = CardProps;

const Wrapper = styled.div`
  margin-bottom: ${listGutter}px;
  .ant-card {
    border-radius: 0px;
  }
`;
const Card = ({className, ...props}: iCard) => {
  return <Wrapper><AntdCard {...props} className={`app-Card ${className || ''}`} /></Wrapper>;
};

export default Card;
