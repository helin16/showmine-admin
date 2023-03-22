import React, { useEffect } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import AppFooter from '../Components/AppFooter'
import { RootState } from '../Redux/makeReduxStore'
import { selectMenu, collapseSideMenu, expandSideMenu } from '../Redux/reduxers/backendpage.slice'
import CompanyLogo from '../Components/Menu/CompanyLogo'
import CompanyInvalidNotice from '../Components/Company/CompanyInvalidNotice'
import { APP_WIDTHS } from '../Constants'
import { pageMinHeight, logoMinHeight, contentSideMargin, contentInternalMargin } from '../Styles/AppWrapper'
import Layout, { Sider, Content, Footer } from '../Components/Form/Layout'
import BackendPageHeader from './BackendPageHeader'
import BackendPageSideMenu from './BackendPageSideMenu'

const BackendPageWrapper = styled.div`
  width: 100%;
  height: 100vh;

  @media only screen and (max-width: ${APP_WIDTHS.xs}) {
    .ant-layout-content {
      padding: 0px !important;
    }
    .hidden-xs {
      display: none;
    }
  }

  .content-header {
    margin-bottom: ${contentInternalMargin};
  }
`

type iBackendPage = {
  children: any
  selectedMenu: string
  ContentHeader?: any
  checkPackage?: boolean
}
/**
 * Backend page
 * @param children
 */
const BackendPage = ({ children, selectedMenu, ContentHeader, checkPackage = false }: iBackendPage) => {
  // eslint-disable-line
  const dispatch = useDispatch()
  const { collapsed } = useSelector((s: RootState) => s.backendPage)
  const { company } = useSelector((s: RootState) => s.auth)
  /**
   *
   */
  useEffect(() => {
    dispatch(selectMenu({ selectedMenuKey: selectedMenu }))
  }, [selectedMenu, dispatch])

  const collapse = (isCollapsed: boolean) => {
    if (isCollapsed === true) {
      dispatch(collapseSideMenu())
    } else {
      dispatch(expandSideMenu())
    }
  }

  const getChildren = () => {
    if (checkPackage === false) {
      return children
    }
    const companyId = `${company?.id || ''}`.trim()
    const companyActive = company && company.isActive === true
    if (companyId === '' || companyActive !== true) {
      return <CompanyInvalidNotice company={company} />
    }
    return children
  }

  /**
   * render
   */
  return (
    <BackendPageWrapper className={`backend-page-wrapper ${collapsed === true ? 'sider-collapsed' : ''}`}>
      <Layout className={'backend-page'} style={{ minHeight: `${pageMinHeight}` }}>
        <Sider
          trigger={null}
          collapsedWidth={0}
          collapsible
          collapsed={collapsed}
          onCollapse={collapse}
          breakpoint='lg'
        >
          <div className={'logo-wrapper'} style={{ minHeight: `${logoMinHeight}` }}>
            <CompanyLogo />
          </div>
          <BackendPageSideMenu />
        </Sider>

        <Layout className='site-layout'>
          <BackendPageHeader />
          <Content
            className='site-layout-background'
            style={{
              margin: `24px ${contentSideMargin}`,
              padding: 24,
              minHeight: 280,
            }}
          >
            {ContentHeader ? <div className={'content-header'}>{ContentHeader}</div> : null}
            {getChildren()}
          </Content>
          <Footer>
            <AppFooter />
          </Footer>
        </Layout>
      </Layout>
    </BackendPageWrapper>
  )
}

export default BackendPage
