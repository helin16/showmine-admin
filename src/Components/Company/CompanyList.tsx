import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import moment from 'moment'
import { RootState } from '../../Redux/makeReduxStore'
import CompanyService from '../../Services/CompanyService'
import LocalStorageService from '../../Services/LocalStorageService'
import InvalidAccessPanel from '../Error/InvalidAccessPanel'
import { BACK_END_URL } from '../../UrlMap'
import ICompany from '../../Types/Company/ICompany'
import CompanyDeleteBtn from './CompanyDeleteBtn'
import message from '../Form/message'
import Space from '../Form/Space'
import Tooltip from '../Form/Tooltip'
import Button from '../Form/Button'
import Icons from '../Icons'
import Card from '../Form/Card'
import Table from '../Form/Table'
import Modal from '../Form/Modal'
import Alert from '../Form/Alert'
import AuthService from '../../Services/AuthService'
import Utils from '../../Services/Utils'
import translate from '../../i18n/translate'

const CompanyListWrapper = styled.div`
  .company-name-link {
    padding: 0px;
    height: auto;
    border: none;
    background: transparent;
    white-space: initial;
    text-align: left;
    font-size: 14px;
  }
`

type iState = {
  companies: ICompany[]
  loading: boolean
  loadingErr?: string
  showingCompany?: ICompany
}
const initialState: iState = {
  companies: [],
  loading: false,
}
const CompanyList = () => {
  const [state, setState] = useState(initialState)
  const { user, company } = useSelector((s: RootState) => s.auth)
  const isSuperAdmin = user?.isSuperAdmin === true

  useEffect(() => {
    if (!isSuperAdmin) return

    setState((s) => ({
      ...s,
      loading: true,
      loadingErr: undefined,
    }))
    let isCancelled = false
    CompanyService.getAll({
      where: JSON.stringify({ isActive: true }),
      perPage: 9999,
      currentPage: 1,
      sort: 'createdAt:DESC',
    })
      .then((res) => {
        if (isCancelled === true) return
        setState((s) => ({
          ...s,
          companies: res.data,
          loading: false,
        }))
      })
      .catch((err) => {
        if (isCancelled === true) return
        setState((s) => ({
          ...s,
          loadingErr: translate('error-getting-companies', { message: Utils.getErrorMessage(err) }),
          loading: false,
        }))
      })
    return () => {
      isCancelled = true
    }
  }, [isSuperAdmin])

  const getOptionBtns = (comp: ICompany) => {
    const websiteUrl = `${comp.websiteUrl || ''}`
    return (
      <Space>
        {`${comp.contactNumber || ''}` !== '' ? (
          <Tooltip title={comp.contactNumber}>
            <Button icon={<Icons.PhoneOutlined />} type={'link'} href={`tel:${comp.contactNumber}`} />
          </Tooltip>
        ) : null}
        {`${comp.email || ''}` !== '' ? (
          <Tooltip title={comp.email}>
            <Button icon={<Icons.MailOutlined />} type={'link'} href={`mailto:${comp.email}`} />
          </Tooltip>
        ) : null}
        {websiteUrl !== '' ? (
          <Tooltip title={websiteUrl}>
            <Button
              icon={<Icons.GlobalOutlined />}
              type={'link'}
              // Companies type this in themselves: without a scheme it would be a relative link, or a javascript: one.
              href={/^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`}
              target={'_blank'}
            />
          </Tooltip>
        ) : null}
      </Space>
    )
  }

  const getNameLink = (comp: ICompany) => (
    <div>
      <Tooltip title={translate('company-view-json')}>
        <Button
          type={'link'}
          className={'company-name-link'}
          onClick={() => setState((s) => ({ ...s, showingCompany: comp }))}
        >
          {comp.name}
        </Button>
      </Tooltip>
      <div>
        <small>{moment(comp.createdAt).format('ll')}</small>
      </div>
    </div>
  )

  const getPlanNote = (comp: ICompany) => {
    if (comp.adminConfig?.complimentary === true) {
      return <small>{translate('plan-complimentary')}</small>
    }
    return comp.paidTo ? <small>{translate('plan-paid-to', { date: moment(comp.paidTo).format('ll') })}</small> : null
  }

  // Companies from before plans have none, and no limits.
  const getPlanDiv = (comp: ICompany) => (
    <>
      <div>{translate(`plan-${comp.adminConfig?.plan || 'none'}`)}</div>
      {getPlanNote(comp)}
    </>
  )

  // The company id header comes from this tab's storage, and everything already loaded belongs to the old company.
  const switchCompany = (comp: ICompany) => {
    AuthService.updateMe({
      lastVisitCompanyId: comp.id,
    })
      .then(() => {
        LocalStorageService.setCompanyId(`${comp.id}`)
        window.location.href = BACK_END_URL
      })
      .catch((err) => {
        message.error(translate('company-switch-error', { message: Utils.getErrorMessage(err) }))
      })
  }

  const companyDeleted = (deleted: ICompany) => {
    setState((s) => ({
      ...s,
      companies: s.companies.filter((com: ICompany) => com.id !== deleted.id),
    }))
  }

  const getBtns = (comp: ICompany) => {
    if (comp.id === company?.id) return null
    return (
      <Space>
        <Tooltip title={translate('company-switch')}>
          <Button
            type={'primary'}
            aria-label={translate('company-switch')}
            onClick={() => switchCompany(comp)}
            icon={<Icons.UserOutlined />}
          />
        </Tooltip>
        <CompanyDeleteBtn company={comp} onDeleted={companyDeleted} noText={true} />
      </Space>
    )
  }

  if (!isSuperAdmin) {
    return <InvalidAccessPanel homeUrl={BACK_END_URL} />
  }

  if (state.loadingErr) {
    return <Alert type='error' message={state.loadingErr} />
  }

  return (
    <CompanyListWrapper className={'company-list'}>
      <Card>
        <Table
          loading={state.loading}
          pagination={false}
          className={'company-table'}
          rowKey={'id'}
          columns={[
            {
              title: translate('name'),
              key: 'name',
              render: getNameLink,
            },
            {
              title: translate('plan'),
              key: 'plan',
              width: 120,
              render: getPlanDiv,
            },
            {
              title: translate('contacts'),
              key: 'contacts',
              width: 160,
              render: getOptionBtns,
            },
            {
              title: '',
              key: 'btns',
              width: 100,
              render: getBtns,
            },
          ]}
          dataSource={state.companies}
        />
      </Card>
      {!state.showingCompany ? null : (
        <Modal
          width={'80%'}
          open={state.showingCompany !== undefined}
          title={state.showingCompany.name}
          footer={null}
          onCancel={() => setState((s) => ({ ...s, showingCompany: undefined }))}
        >
          <pre>{JSON.stringify(state.showingCompany, null, 2)}</pre>
        </Modal>
      )}
    </CompanyListWrapper>
  )
}

export default CompanyList
