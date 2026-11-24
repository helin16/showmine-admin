import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Input } from 'antd'
import { RootState } from '../../Redux/makeReduxStore'
import { MENU_KEY_COMPANY_WEBSITE } from '../../Components/Menu/MenuItems'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import InvalidAccessPanel from '../../Components/Error/InvalidAccessPanel'
import Alert from '../../Components/Form/Alert'
import Button from '../../Components/Form/Button'
import Card from '../../Components/Form/Card'
import Empty from '../../Components/Form/Empty'
import Modal from '../../Components/Form/Modal'
import PopConfirm from '../../Components/Form/Popconfirm'
import Space from '../../Components/Form/Space'
import Spin from '../../Components/Form/Spin'
import Table from '../../Components/Form/Table'
import Tag from '../../Components/Form/Tag'
import message from '../../Components/Form/message'
import translate from '../../i18n/translate'
import WebsiteService from '../../Services/WebsiteService'
import Utils from '../../Services/Utils'
import { IWebsitePage, PAGE_SLUG_PATTERN } from '../../Types/Website/IWebsite'
import { COMPANY_WEBSITE_PAGE_URL, COMPANY_WEBSITE_TEMPLATES_URL, COMPANY_WEBSITE_URL, getUrl } from '../../UrlMap'

// The website's pages (specs/001-website-builder, US2, T034): add, reorder with Up and Down, edit and delete. The first
// page is the home page.
type iAdding = { title: string; slug: string; errors: { [field: string]: string }; saving: boolean }
type iState = {
  loading: boolean
  pages?: IWebsitePage[]
  loadError?: string
  hasNoWebsite: boolean
  working: boolean
  adding?: iAdding
  count: number
}
const initState: iState = { loading: false, hasNoWebsite: false, working: false, count: 0 }

const WebsitePagesPage = () => {
  const { company } = useSelector((s: RootState) => s.auth)
  const isOn = company?.websiteBuilderEnabled === true
  const navigate = useNavigate()
  const [state, setState] = useState(initState)
  // Answers that arrive after a switch of company are for the old one and are dropped.
  const companyIdRef = useRef(company?.id)
  companyIdRef.current = company?.id
  const forThisCompany = <T,>(work: (value: T) => void) => {
    const companyId = company?.id
    return (value: T) => {
      if (companyIdRef.current === companyId) work(value)
    }
  }

  useEffect(() => {
    if (!isOn) return
    let isCurrent = true
    setState((s) => ({ ...s, loading: true, loadError: undefined, hasNoWebsite: false, adding: undefined }))
    WebsiteService.getPages()
      .then((pages) => isCurrent && setState((s) => ({ ...s, pages })))
      .catch((err) => {
        if (!isCurrent) return
        setState((s) => ({
          ...s,
          pages: undefined,
          ...(err?.response?.status === 404 ? { hasNoWebsite: true } : { loadError: Utils.getErrorMessage(err) }),
        }))
      })
      .finally(() => isCurrent && setState((s) => ({ ...s, loading: false })))
    return () => {
      isCurrent = false
    }
  }, [isOn, company?.id, state.count])

  const reload = () => setState((s) => ({ ...s, count: s.count + 1 }))

  const move = (index: number, by: number) => {
    const pages = [...(state.pages || [])]
    const [page] = pages.splice(index, 1)
    pages.splice(index + by, 0, page)
    setState((s) => ({ ...s, working: true }))
    WebsiteService.orderPages(pages.map((p) => `${p.id}`))
      .then(forThisCompany((saved: IWebsitePage[]) => setState((s) => ({ ...s, pages: saved }))))
      .catch(
        forThisCompany((err: unknown) => {
          // The pages changed meanwhile (400): show them as they are now.
          message.error(Utils.getErrorMessage(err))
          reload()
        }),
      )
      .finally(() => setState((s) => ({ ...s, working: false })))
  }

  const remove = (page: IWebsitePage) => {
    setState((s) => ({ ...s, working: true }))
    WebsiteService.deletePage(`${page.id}`)
      .then(
        forThisCompany(() => {
          message.success(translate('website-page-deleted', { title: page.title }))
          reload()
        }),
      )
      .catch(forThisCompany((err: unknown) => message.error(Utils.getErrorMessage(err))))
      .finally(() => setState((s) => ({ ...s, working: false })))
  }

  const setAdding = (changes: Partial<iAdding>) =>
    setState((s) => (s.adding ? { ...s, adding: { ...s.adding, ...changes } } : s))

  const add = () => {
    const { adding } = state
    if (!adding || adding.saving) return
    const title = adding.title.trim()
    const slug = adding.slug.trim()
    const errors = {
      ...(title === '' ? { title: translate('website-page-title-required') } : {}),
      ...(PAGE_SLUG_PATTERN.test(slug) ? {} : { slug: translate('website-page-slug-bad') }),
    }
    if (Object.keys(errors).length > 0) {
      setAdding({ errors })
      return
    }
    setAdding({ saving: true, errors: {} })
    WebsiteService.createPage({ title, slug })
      .then(
        forThisCompany((page: IWebsitePage) => {
          message.success(translate('website-page-added', { title: page.title }))
          navigate(getUrl(COMPANY_WEBSITE_PAGE_URL, ':id', `${page.id}`))
        }),
      )
      .catch(
        forThisCompany(
          (err: {
            response?: { status?: number; data?: { message?: string; errors?: { path: string; message: string }[] } }
          }) => {
            const { status, data } = err?.response || {}
            const fieldErrors = Object.fromEntries((data?.errors || []).map((e) => [e.path, e.message]))
            if (Object.keys(fieldErrors).length > 0) {
              setAdding({ errors: fieldErrors, saving: false })
            } else if (status === 409) {
              setAdding({ errors: { slug: translate('website-page-slug-taken') }, saving: false })
            } else {
              setAdding({ errors: { form: Utils.getErrorMessage(err) }, saving: false })
            }
          },
        ),
      )
  }

  const getTable = (pages: IWebsitePage[]) => (
    <Table
      rowKey={'id'}
      pagination={false}
      dataSource={pages}
      columns={[
        {
          title: translate('website-page-title'),
          key: 'title',
          render: (page: IWebsitePage, _row: IWebsitePage, index: number) => (
            <Space wrap>
              <Link to={getUrl(COMPANY_WEBSITE_PAGE_URL, ':id', `${page.id}`)}>{page.title}</Link>
              {index === 0 ? <Tag color={'blue'}>{translate('website-page-home')}</Tag> : null}
              {page.hasUnpublishedChanges ? <Tag color={'orange'}>{translate('website-page-changed')}</Tag> : null}
            </Space>
          ),
        },
        {
          title: translate('website-page-slug'),
          key: 'slug',
          render: (page: IWebsitePage) => `/${page.slug}`,
        },
        {
          title: '',
          key: 'actions',
          render: (page: IWebsitePage, _row: IWebsitePage, index: number) => (
            <Space wrap>
              <Button
                aria-label={translate('website-move-up', { name: page.title })}
                disabled={state.working || index === 0}
                onClick={() => move(index, -1)}
              >
                ↑
              </Button>
              <Button
                aria-label={translate('website-move-down', { name: page.title })}
                disabled={state.working || index === pages.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </Button>
              <PopConfirm
                title={translate('website-page-delete-confirm', { title: page.title })}
                okText={translate('website-delete')}
                cancelText={translate('cancel')}
                okButtonProps={{ danger: true }}
                onConfirm={() => remove(page)}
              >
                <Button
                  danger
                  disabled={state.working}
                  aria-label={translate('website-delete-named', { name: page.title })}
                >
                  {translate('website-delete')}
                </Button>
              </PopConfirm>
            </Space>
          ),
        },
      ]}
    />
  )

  const getContent = () => {
    if (state.hasNoWebsite) {
      return (
        <Alert
          type={'warning'}
          message={translate('website-templates-no-website')}
          action={<Link to={COMPANY_WEBSITE_URL}>{translate('website-templates-create-first')}</Link>}
        />
      )
    }
    if (state.loadError) {
      return (
        <Alert
          type={'error'}
          message={translate('website-pages-load-failed', { message: state.loadError })}
          action={<Button onClick={reload}>{translate('retry')}</Button>}
        />
      )
    }
    if (!state.pages) {
      return null
    }
    return (
      <Card>
        <Space orientation={'vertical'} style={{ width: '100%' }}>
          <Space wrap>
            <Button
              type={'primary'}
              onClick={() => setState((s) => ({ ...s, adding: { title: '', slug: '', errors: {}, saving: false } }))}
            >
              {translate('website-page-add')}
            </Button>
            <Link to={COMPANY_WEBSITE_TEMPLATES_URL}>{translate('website-templates-choose')}</Link>
          </Space>
          {state.pages.length === 0 ? <Empty description={translate('website-pages-none')} /> : getTable(state.pages)}
        </Space>
      </Card>
    )
  }

  const { adding } = state
  return (
    <BackendPage
      selectedMenu={MENU_KEY_COMPANY_WEBSITE}
      ContentHeader={<BackendPageContentTitle title={translate('website-pages')} />}
    >
      {isOn ? <Spin spinning={state.loading}>{getContent()}</Spin> : <InvalidAccessPanel />}
      {adding ? (
        <Modal
          open
          title={translate('website-page-add')}
          okText={translate('website-page-add')}
          cancelText={translate('cancel')}
          confirmLoading={adding.saving}
          onOk={add}
          onCancel={() => setState((s) => ({ ...s, adding: undefined }))}
        >
          <Space orientation={'vertical'} style={{ width: '100%' }}>
            {(['title', 'slug'] as const).map((name) => (
              <div key={name}>
                <label htmlFor={`new-page-${name}`}>{translate(`website-page-${name}`)}</label>
                <Input
                  id={`new-page-${name}`}
                  value={adding[name]}
                  maxLength={name === 'title' ? 80 : 40}
                  status={adding.errors[name] ? 'error' : undefined}
                  aria-invalid={adding.errors[name] ? true : undefined}
                  onChange={(e) => setAdding({ [name]: e.target.value })}
                  onPressEnter={add}
                />
                {name === 'slug' ? <div>{translate('website-page-slug-help')}</div> : null}
                {adding.errors[name] ? (
                  <div role={'alert'} className={'ant-form-item-explain-error'}>
                    {adding.errors[name]}
                  </div>
                ) : null}
              </div>
            ))}
            {adding.errors.form ? <Alert type={'error'} message={adding.errors.form} /> : null}
          </Space>
        </Modal>
      ) : null}
    </BackendPage>
  )
}

export default WebsitePagesPage
