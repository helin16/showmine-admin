import React from 'react';
import styled from 'styled-components';
import PackageNoticeBoard from '../Components/Package/PackageNoticeBoard';
import Row from '../Components/Form/Row';
import Col from '../Components/Form/Col';
import Space from '../Components/Form/Space';

export interface IContentTitleProps {
  title: React.ReactNode,
  description?: React.ReactNode | string,
  controls?: React.ReactNode,
  checkPackage?: boolean
}

const TitleWrapper = styled.div`
  .title {
    font-size: 24px;
    min-width: 100px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`;

/**
 * Backend Page Header
 * @param children
 */
const BackendPageContentTitle = ({
  title, description, controls, checkPackage,
}: IContentTitleProps) => (
    <TitleWrapper>
      {checkPackage === false ? null : (
        <PackageNoticeBoard />
      )}
      <Row justify={'space-between'} align={'bottom'}>
        <Col flex={'auto'}>
          <Row>
            <Col flex={1}>
              <div className={'title'}>{title}</div>
            </Col>
            <Col flex={'auto'}>
              <small>{description}</small>
            </Col>
          </Row>
        </Col>
        <Col flex={1} style={{
          textAlign: 'right',
        }}>
          <Space align={'end'}>
            {controls}
          </Space>
        </Col>
      </Row>
    </TitleWrapper>
);

export default BackendPageContentTitle;
