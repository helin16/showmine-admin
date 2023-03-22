import React from 'react'
import { useSelector } from 'react-redux'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import { RootState } from '../../Redux/makeReduxStore'
import CompanyMediaUsage from '../../Components/Media/CompanyMediaUsage'
import CompanyArticleStats from '../../Components/Article/CompanyArticleStats'
import CompanyChannelStats from '../../Components/Channel/CompanyChannelStats'
import CompanyUserStats from '../../Components/User/CompanyUserStats'
import VisitStats from '../../Components/Stats/VisitStats'
import { ARTICLE_DETAILS_URL } from '../../UrlMap'
import { MENU_KEY_DASHBOARD } from '../../Components/Menu/MenuItems'
import Row from '../../Components/Form/Row'
import Col from '../../Components/Form/Col'
import Button from '../../Components/Form/Button'
import Icons from '../../Components/Icons'
import { useNavigate } from 'react-router-dom'
import { listGutter } from '../../Styles/AppWrapper'
import translate from '../../i18n/translate'
import Card from '../../Components/Form/Card'

const DashBoardPage = () => {
  const { company } = useSelector((s: RootState) => s.auth)
  const navigate = useNavigate()

  if (!company) {
    return null
  }
  // if (!company.co) {
  //   navigate(WIZARD_URL);
  //   return null;
  // }

  return (
    <BackendPage
      selectedMenu={MENU_KEY_DASHBOARD}
      ContentHeader={
        <BackendPageContentTitle
          title={translate('dashboard')}
          controls={
            <Button type='primary' icon={<Icons.PlusOutlined />} href={ARTICLE_DETAILS_URL}>
              {translate('new-article')}
            </Button>
          }
        />
      }
    >
      <Row gutter={listGutter}>
        <Col xs={{ span: 24 }} sm={{ span: 12 }} md={{ span: 6 }}>
          <Card>
            <CompanyArticleStats />
          </Card>
        </Col>
        <Col xs={{ span: 24 }} sm={{ span: 12 }} md={{ span: 6 }}>
          <Card>
            <CompanyMediaUsage />
          </Card>
        </Col>
        <Col xs={{ span: 24 }} sm={{ span: 12 }} md={{ span: 6 }}>
          <Card>
            <CompanyChannelStats />
          </Card>
        </Col>
        <Col xs={{ span: 24 }} sm={{ span: 12 }} md={{ span: 6 }}>
          <Card>
            <CompanyUserStats />
          </Card>
        </Col>
        <Col xs={{ span: 24 }}>
          <Card>
            <VisitStats />
          </Card>
        </Col>
      </Row>
    </BackendPage>
  )
}

export default DashBoardPage
