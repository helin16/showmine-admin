import React from 'react';
import { Link } from 'react-router-dom';
import {
  BACK_END_URL, ARTICLE_LIST_URL, COMPANY_CHANNELS_URL, COMPANY_ADMIN_URL,
} from '../../UrlMap';
import translate from '../../i18n/translate';
import Result from '../../Components/Form/Result';
import Icons from '../../Components/Icons';
import Divider from '../../Components/Form/Divider';
import Row from '../../Components/Form/Row';
import Col from '../../Components/Form/Col';
import Card, {CardMeta} from '../../Components/Form/Card';
import Button from '../../Components/Form/Button';
const WizardDonePage = () => {
  return (
    <div>
      <Result
        status="success"
        icon={<Icons.SmileOutlined />}
        title="Basic Setting Completed!"
        subTitle="Basic setting has been completed..."
        extra={[
          <Link to={BACK_END_URL} key='back-end'>
            <Button type="primary" key="ok">
              {translate('ok')}
            </Button>
          </Link>,
        ]}
      />
      <Divider />
      <p style={{ textAlign: 'center' }}>
        Basic setting has been completed, now you can try some other features on your own
      </p>
      <div style={{ padding: '30px', background: '#ececec' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Link to={BACK_END_URL}>
              <Card className='wizard-done-card' hoverable bordered={false} cover={<Icons.DashboardFilled style={{ fontSize: '48px', color: '#08c', padding: '30px 0' }}/>} >
                <CardMeta style={{ textAlign: 'center' }} title={translate('dashboard')} description={translate('wizard-dashboard')} />
              </Card>
            </Link>

          </Col>
          <Col span={6}>
            <Link to={ARTICLE_LIST_URL}>
              <Card className='wizard-done-card' hoverable bordered={false} cover={<Icons.FileFilled style={{ fontSize: '48px', color: '#08c', padding: '30px 0' }}/>} >
                <CardMeta style={{ textAlign: 'center' }} title={translate('news_article')} description={translate('wizard-article')} />
              </Card>
            </Link>

          </Col>
          <Col span={6}>
            <Link to={COMPANY_CHANNELS_URL}>
              <Card className='wizard-done-card' hoverable bordered={false} cover={<Icons.ApartmentOutlined rotate={270} style={{ fontSize: '48px', color: '#08c', padding: '30px 0' }}/>} >
                <CardMeta style={{ textAlign: 'center' }} title={translate('channels')} description={translate('wizard-channel')} />
              </Card>
            </Link>

          </Col>
          <Col span={6}>
            <Link to={COMPANY_ADMIN_URL}>
              <Card className='wizard-done-card' hoverable bordered={false} cover={<Icons.SettingFilled style={{ fontSize: '48px', color: '#08c', padding: '30px 0' }}/>} >
                <CardMeta style={{ textAlign: 'center' }} title={translate('company-admin')} description={translate('wizard-company-admin')} />
              </Card>
            </Link>

          </Col>
        </Row>
      </div>
    </div>
  );
}

export default WizardDonePage;
