import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { RootState } from '../../Redux/makeReduxStore'
import WizardDonePage from './WizardDonePage'
import translate from '../../i18n/translate'
import { ARTICLE_DETAILS_URL, getUrl } from '../../UrlMap'
import ArticleService from '../../Services/ArticleService'
import CompanyService from '../../Services/CompanyService'
import ICompany from '../../Types/Company/ICompany'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import CompanyBasicInfoEditor from '../../Components/Company/CompanyBasicInfoEditor'
import Icons from '../../Components/Icons'
import ChannelList from '../../Components/Channel/ChannelList'
import BackendPage from '../../Layouts/BackendPage'
import Card from '../../Components/Form/Card'
import Steps from '../../Components/Form/Steps'
import Button from '../../Components/Form/Button'
import ArticleList from '../../Components/Article/ArticleList'

const SectionDiv = styled.div`
  text-align: center;
`

type iState = {
  company?: ICompany
  loading: boolean
  loadingErr?: object
  showArticleList?: boolean
}
const initState: iState = {
  loading: false,
  showArticleList: true,
}

const WizardPage = () => {
  const [state, setState] = React.useState(initState)
  const [current, setCurrent] = React.useState(0)
  const { company } = useSelector((s: RootState) => s.auth)

  useEffect(() => {
    if (!company || !company.id) return
    setState((s) => ({
      ...s,
      company,
      loading: true,
      loadingErr: undefined,
    }))
    ArticleService.getAll({ currentPage: 1, perPage: 1, where: JSON.stringify({ isActive: true }) }).then((res) => {
      setState((st) => ({
        ...st,
        loading: false,
        showArticleList: res.data.length > 0,
      }))
    })
  }, [company])

  const steps = [
    {
      title: translate('setup-account'),
      content: (
        <>
          <BackendPageContentTitle title={translate('company')} checkPackage={false} />
          {state.company ? <CompanyBasicInfoEditor company={state.company} /> : null}
        </>
      ),
      icon: <Icons.SettingOutlined />,
    },
    {
      title: translate('channels'),
      content: (
        <>
          <BackendPageContentTitle
            title={translate('channels')}
            // description='Channel setting has been completed, now you can try add new article'
            checkPackage={false}
          />
          {state.company ? <ChannelList /> : null}
        </>
      ),
      icon: <Icons.ApartmentOutlined rotate={270} />,
    },
    {
      title: translate('news_article'),
      content: (
        <>
          <BackendPageContentTitle title={translate('news_article')} checkPackage={false} />
          {state.company && state.showArticleList ? (
            <ArticleList company={state.company} />
          ) : (
            <SectionDiv>
              <Link to={getUrl(getUrl(ARTICLE_DETAILS_URL, ':id', 'new'))}>
                <Button type='primary' icon={<Icons.PlusOutlined />}>
                  {translate('new-article')}
                </Button>
              </Link>
            </SectionDiv>
          )}
        </>
      ),
      icon: <Icons.FileOutlined />,
    },
    {
      title: translate('finish'),
      content: <WizardDonePage />,
      icon: <Icons.SmileOutlined />,
    },
  ]

  const next = () => {
    if (company && company.id) {
      CompanyService.update(company.id, {
        config: {
          ...(company.config || {}),
          // eslint-disable-next-line camelcase
          has_been_setup: true,
        },
      }).then(() => {
        setCurrent(current + 1);
      })
    } else {
      setCurrent(current + 1)
    }
  }

  const prev = () => {
    setCurrent(current - 1)
  }

  return (
    <BackendPage
      selectedMenu={''}
      checkPackage={false}
      ContentHeader={<BackendPageContentTitle title={translate('setup-wizard')} checkPackage={false} />}
    >
      <Card>
        <Steps
          current={current}
          items={steps.map((item) => ({
            title: item.title,
            icon: item.icon,
            key: item.title,
          }))}
        />
        <div className='steps-content'>{steps[current].content}</div>
        <div className='steps-action'>
          {current > 0 && (
            <Button style={{ margin: '0 8px' }} onClick={() => prev()}>
              {translate('previous')}
            </Button>
          )}
          {current < steps.length - 1 && (
            <Button type='primary' onClick={() => next()}>
              {translate('next')}
            </Button>
          )}
        </div>
      </Card>
    </BackendPage>
  )
}

export default WizardPage
