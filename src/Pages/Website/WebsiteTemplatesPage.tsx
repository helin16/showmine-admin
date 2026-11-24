import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { RootState } from '../../Redux/makeReduxStore'
import { MENU_KEY_COMPANY_WEBSITE } from '../../Components/Menu/MenuItems'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import InvalidAccessPanel from '../../Components/Error/InvalidAccessPanel'
import Alert from '../../Components/Form/Alert'
import Button from '../../Components/Form/Button'
import Card from '../../Components/Form/Card'
import Col from '../../Components/Form/Col'
import Empty from '../../Components/Form/Empty'
import Modal from '../../Components/Form/Modal'
import Row from '../../Components/Form/Row'
import Space from '../../Components/Form/Space'
import Spin from '../../Components/Form/Spin'
import message from '../../Components/Form/message'
import translate from '../../i18n/translate'
import WebsiteService from '../../Services/WebsiteService'
import Utils from '../../Services/Utils'
import { IWebsiteTemplate } from '../../Types/Website/IWebsite'
import { COMPANY_WEBSITE_URL } from '../../UrlMap'

// The template gallery (specs/001-website-builder, US4, T055): preview a template on the Reader, then use it to create
// the website's pages. Existing pages are replaced only after the admin confirms how many.
type iState = {
  loading: boolean
  templates?: IWebsiteTemplate[]
  loadError?: string
  // The template being applied.
  usingId?: string
  // Waiting for the admin to agree to replace this many pages.
  confirming?: { template: IWebsiteTemplate; pageCount: number }
  hasNoWebsite: boolean
  count: number
}
const initState: iState = { loading: false, hasNoWebsite: false, count: 0 }

const NO_WEBSITE = 'This company has no website yet.'
const NO_TEMPLATE = 'This template does not exist.'

const WebsiteTemplatesPage = () => {
  const { company } = useSelector((s: RootState) => s.auth)
  const { locale } = useSelector((s: RootState) => s.app)
  const isOn = company?.websiteBuilderEnabled === true
  const isChinese = `${locale?.locale || ''}`.startsWith('zh')
  const navigate = useNavigate()
  const [state, setState] = useState(initState)
  // The company the page shows; answers that arrive after a switch of company are for the old one and are dropped.
  const companyIdRef = useRef(company?.id)
  companyIdRef.current = company?.id

  useEffect(() => {
    if (!isOn) return
    let isCurrent = true
    setState((s) => ({
      ...s,
      loading: true,
      loadError: undefined,
      hasNoWebsite: false,
      confirming: undefined,
      usingId: undefined,
    }))
    WebsiteService.getTemplates()
      .then((templates) => isCurrent && setState((s) => ({ ...s, templates })))
      .catch(
        (err) => isCurrent && setState((s) => ({ ...s, templates: undefined, loadError: Utils.getErrorMessage(err) })),
      )
      .finally(() => isCurrent && setState((s) => ({ ...s, loading: false })))
    return () => {
      isCurrent = false
    }
  }, [isOn, company?.id, state.count])

  const reload = () => setState((s) => ({ ...s, count: s.count + 1 }))

  const getName = (template: IWebsiteTemplate) => (isChinese ? template.name.zh : template.name.en)

  const applyTemplate = (template: IWebsiteTemplate, pageCount?: number) => {
    const companyId = company?.id
    const isSameCompany = () => companyIdRef.current === companyId
    setState((s) => ({ ...s, usingId: template.id, confirming: undefined }))
    WebsiteService.initialise({
      templateId: template.id,
      templateVersion: template.version,
      ...(pageCount === undefined ? {} : { replace: true, pageCount }),
    })
      .then(() => {
        if (!isSameCompany()) return
        message.success(translate('website-template-used', { name: getName(template) }))
        navigate(COMPANY_WEBSITE_URL)
      })
      .catch((err) => {
        if (!isSameCompany()) return
        const { status, data } = err?.response || {}
        if (status === 409 && Number.isInteger(data?.pageCount)) {
          // Pages exist, or more were added since the admin agreed: ask again with the current count.
          setState((s) => ({ ...s, confirming: { template, pageCount: data.pageCount } }))
        } else if (status === 409 || (status === 404 && data?.message === NO_TEMPLATE)) {
          // The template changed or was withdrawn since the list was loaded.
          message.error(translate('website-template-updated'))
          reload()
        } else if (status === 404 && data?.message === NO_WEBSITE) {
          setState((s) => ({ ...s, hasNoWebsite: true }))
        } else if (status === 403) {
          message.error(translate('website-template-plan-limit'))
        } else {
          message.error(Utils.getErrorMessage(err))
        }
      })
      .finally(() => isSameCompany() && setState((s) => ({ ...s, usingId: undefined })))
  }

  const getCard = (template: IWebsiteTemplate) => {
    const name = getName(template)
    const previewUrl = WebsiteService.getReaderUrl(`/t/${encodeURIComponent(template.id)}`)
    return (
      <Col xs={24} md={12} lg={8} key={template.id}>
        <Card
          cover={<img src={template.thumbnail} alt={translate('website-template-thumbnail', { name })} />}
          actions={[
            <Button
              key={'preview'}
              type={'link'}
              href={previewUrl ?? undefined}
              target={'_blank'}
              rel={'noopener noreferrer'}
              disabled={previewUrl === null}
            >
              {translate('website-template-preview')}
            </Button>,
            <Button
              key={'use'}
              type={'primary'}
              loading={state.usingId === template.id}
              disabled={state.usingId !== undefined && state.usingId !== template.id}
              onClick={() => applyTemplate(template)}
            >
              {translate('website-template-use')}
            </Button>,
          ]}
        >
          <h3>{name}</h3>
          <p>{isChinese ? template.description.zh : template.description.en}</p>
        </Card>
      </Col>
    )
  }

  const getContent = () => {
    if (state.loadError) {
      return (
        <Alert
          type={'error'}
          message={translate('website-templates-load-failed', { message: state.loadError })}
          action={<Button onClick={reload}>{translate('retry')}</Button>}
        />
      )
    }
    if (!state.templates) {
      return null
    }
    if (state.templates.length === 0) {
      return <Empty description={translate('website-templates-none')} />
    }
    return (
      <Space orientation={'vertical'} style={{ width: '100%' }}>
        <Alert type={'info'} message={translate('website-template-theme-note')} />
        {WebsiteService.getReaderUrl('') === null ? (
          <Alert type={'warning'} message={translate('website-address-unknown')} />
        ) : null}
        <Row gutter={[16, 16]}>{state.templates.map(getCard)}</Row>
      </Space>
    )
  }

  const { confirming } = state
  return (
    <BackendPage
      selectedMenu={MENU_KEY_COMPANY_WEBSITE}
      ContentHeader={<BackendPageContentTitle title={translate('website-templates')} />}
    >
      {isOn ? (
        <Spin spinning={state.loading}>
          {state.hasNoWebsite ? (
            <Alert
              type={'warning'}
              message={translate('website-templates-no-website')}
              action={<Link to={COMPANY_WEBSITE_URL}>{translate('website-templates-create-first')}</Link>}
            />
          ) : null}
          {getContent()}
        </Spin>
      ) : (
        <InvalidAccessPanel />
      )}
      {confirming ? (
        <Modal
          open
          title={translate('website-template-replace-title')}
          okText={translate('website-template-replace-ok')}
          okButtonProps={{ danger: true }}
          cancelText={translate('cancel')}
          onOk={() => applyTemplate(confirming.template, confirming.pageCount)}
          onCancel={() => setState((s) => ({ ...s, confirming: undefined }))}
        >
          {translate('website-template-replace', { count: confirming.pageCount })}
        </Modal>
      ) : null}
    </BackendPage>
  )
}

export default WebsiteTemplatesPage
