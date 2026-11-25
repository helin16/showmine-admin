import React, { useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../Redux/makeReduxStore'
import { Link } from 'react-router-dom'
import moment from 'moment'
import Alert from '../Form/Alert'
import Button from '../Form/Button'
import PopConfirm from '../Form/Popconfirm'
import Space from '../Form/Space'
import Tag from '../Form/Tag'
import Icons from '../Icons'
import message from '../Form/message'
import translate from '../../i18n/translate'
import WebsiteService from '../../Services/WebsiteService'
import Utils from '../../Services/Utils'
import IWebsite, { IFieldError, IWebsitePage } from '../../Types/Website/IWebsite'
import { COMPANY_WEBSITE_PAGE_URL, getUrl } from '../../UrlMap'

// The publish state with Publish and Unpublish (specs/001-website-builder, US3, T047). Publishing copies the saved
// draft; a refused publish lists every problem, each linked to its page.
type iPublishBar = {
  website: IWebsite
  onChanged: (website: IWebsite) => void
  // Another admin changed the website: the page reloads it.
  onStale: () => void
  // While the page has unsaved changes, publishing would leave them out.
  hasUnsavedChanges?: boolean
  // False in the page editor's title row, which has Publish only, as an article (SMN-85).
  canUnpublish?: boolean
}

type iProblem = { text: string; pageId?: string }

const PROBLEM_PATH = /^pages\[([^\]]+)\](?:\.sections\[(\d+)\])?/

// "pages[about].sections[2].heading" becomes "About, section 3: <message>", linked to the about page.
export const describeProblems = (errors: IFieldError[], pages: IWebsitePage[]): iProblem[] =>
  errors.map(({ path, message: text }) => {
    const match = PROBLEM_PATH.exec(path)
    if (!match) {
      return { text: path === 'pages' ? text : translate('website-publish-problem-site', { message: text }) }
    }
    const page = pages.find((p) => p.slug === match[1])
    const where =
      match[2] === undefined
        ? translate('website-publish-problem-page', { page: page?.title || match[1] })
        : translate('website-publish-problem-section', { page: page?.title || match[1], number: Number(match[2]) + 1 })
    return { text: `${where}: ${text}`, pageId: page?.id }
  })

const PublishBar = ({ website, onChanged, onStale, hasUnsavedChanges = false, canUnpublish = true }: iPublishBar) => {
  const [working, setWorking] = useState(false)
  const [problems, setProblems] = useState<iProblem[]>([])
  // Answers that arrive after a switch of company are for the old one and are dropped.
  const { company } = useSelector((s: RootState) => s.auth)
  const companyIdRef = useRef(company?.id)
  companyIdRef.current = company?.id
  const forThisCompany = <T,>(work: (value: T) => unknown) => {
    const companyId = company?.id
    return (value: T) => (companyIdRef.current === companyId ? work(value) : undefined)
  }

  const publish = () => {
    setWorking(true)
    setProblems([])
    WebsiteService.publish(website.updatedAt)
      .then(
        forThisCompany((published: IWebsite) => {
          message.success(translate('website-published-now'))
          onChanged(published)
        }),
      )
      .catch(
        forThisCompany(async (err: { response?: { status?: number; data?: { errors?: IFieldError[] } } }) => {
          const { status, data } = err?.response || {}
          if (status === 400 && Array.isArray(data?.errors)) {
            const pages = await WebsiteService.getPages().catch(() => [])
            setProblems(describeProblems(data.errors, pages))
          } else if (status === 409) {
            message.error(translate('website-stale'))
            onStale()
          } else {
            message.error(Utils.getErrorMessage(err))
          }
        }),
      )
      .finally(() => setWorking(false))
  }

  const unpublish = () => {
    setWorking(true)
    WebsiteService.unpublish()
      .then(
        forThisCompany((unpublished: IWebsite) => {
          message.success(translate('website-unpublished-now'))
          onChanged(unpublished)
        }),
      )
      .catch(forThisCompany((err: unknown) => message.error(Utils.getErrorMessage(err))))
      .finally(() => setWorking(false))
  }

  const getStatus = () => {
    if (!website.publishedAt) {
      return <Tag>{translate('website-not-published')}</Tag>
    }
    const date = moment(website.publishedAt).format('lll')
    return website.hasUnpublishedChanges ? (
      <Tag color={'orange'}>{translate('website-unpublished-changes', { date })}</Tag>
    ) : (
      <Tag color={'green'}>{translate('website-published', { date })}</Tag>
    )
  }

  const isUpToDate = !!website.publishedAt && !website.hasUnpublishedChanges
  return (
    <Space orientation={'vertical'} style={{ width: '100%' }}>
      <Space wrap>
        {getStatus()}
        <Button
          type={'primary'}
          icon={<Icons.CloudUploadOutlined aria-hidden />}
          onClick={publish}
          loading={working}
          disabled={working || isUpToDate || hasUnsavedChanges}
        >
          {translate('website-publish')}
        </Button>
        {website.publishedAt && canUnpublish ? (
          <PopConfirm
            title={translate('website-unpublish-confirm')}
            okText={translate('website-unpublish')}
            cancelText={translate('cancel')}
            okButtonProps={{ danger: true }}
            onConfirm={unpublish}
          >
            <Button danger disabled={working}>
              {translate('website-unpublish')}
            </Button>
          </PopConfirm>
        ) : null}
        {hasUnsavedChanges ? <span>{translate('website-publish-save-first')}</span> : null}
      </Space>
      {problems.length > 0 ? (
        <Alert
          type={'error'}
          message={translate('website-publish-refused')}
          description={
            <ul>
              {problems.map((problem, index) => (
                <li key={index}>
                  {problem.pageId ? (
                    <Link to={getUrl(COMPANY_WEBSITE_PAGE_URL, ':id', problem.pageId)}>{problem.text}</Link>
                  ) : (
                    problem.text
                  )}
                </li>
              ))}
            </ul>
          }
        />
      ) : null}
    </Space>
  )
}

export default PublishBar
