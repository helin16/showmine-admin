import React, { useEffect, useState } from 'react'
import moment from 'moment'
import { useIntl } from 'react-intl'
import CompanyUserService from '../../Services/CompanyUserService'
import Utils from '../../Services/Utils'
import ICompanyUser from '../../Types/Company/ICompanyUser'
import Button from '../Form/Button'
import Card from '../Form/Card'
import List, { ListItem, ListItemMeta } from '../Form/List'
import message from '../Form/message'
import PopConfirm from '../Form/Popconfirm'

type iCompanyUserPendingList = {
  onChanged: () => void
}

const CompanyUserPendingList = ({ onChanged }: iCompanyUserPendingList) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [count, setCount] = useState(0)
  const [rows, setRows] = useState<ICompanyUser[]>([])
  const intl = useIntl()

  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)
    CompanyUserService.getPending()
      .then((res) => {
        if (isCancelled === true) return
        setRows(res)
      })
      .catch((err) => {
        if (isCancelled === true) return
        message.error(Utils.getErrorMessage(err))
      })
      .finally(() => setIsLoading(false))
    return () => {
      isCancelled = true
    }
  }, [count])

  // WeChat gives no real nicknames any more, so someone who only scanned a code may have no name at all.
  const getName = ({ User: user }: ICompanyUser) =>
    `${user?.nickName || ''}`.trim() ||
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
    `${user?.email || ''}`.trim() ||
    intl.formatMessage({ id: 'wechat-user' })

  const decide = (row: ICompanyUser, call: (id: string) => Promise<unknown>, doneId: string) => {
    setIsSaving(true)
    call(`${row.id}`)
      .then(() => {
        message.success(intl.formatMessage({ id: doneId }, { name: getName(row) }))
        onChanged()
      })
      .catch((err) => message.error(Utils.getErrorMessage(err)))
      .finally(() => {
        setIsSaving(false)
        setCount((value) => value + 1)
      })
  }

  return (
    <Card
      title={intl.formatMessage({ id: 'pending-requests' })}
      extra={<Button onClick={() => setCount((value) => value + 1)}>{intl.formatMessage({ id: 'refresh' })}</Button>}
    >
      <List
        className='company-users-pending-list'
        loading={isLoading || isSaving}
        itemLayout='horizontal'
        locale={{ emptyText: intl.formatMessage({ id: 'pending-none' }) }}
        dataSource={rows}
        renderItem={(row: ICompanyUser) => (
          <ListItem
            actions={[
              <Button key='approve' type='primary' onClick={() => decide(row, CompanyUserService.approve, 'pending-approved')}>
                {intl.formatMessage({ id: 'approve' })}
              </Button>,
              <PopConfirm
                key='reject'
                title={intl.formatMessage({ id: 'pending-reject-confirm' }, { name: getName(row) })}
                onConfirm={() => decide(row, CompanyUserService.reject, 'pending-rejected')}
                okText={intl.formatMessage({ id: 'yes' })}
                cancelText={intl.formatMessage({ id: 'no' })}
              >
                <Button danger>{intl.formatMessage({ id: 'reject' })}</Button>
              </PopConfirm>,
            ]}
          >
            <ListItemMeta
              title={getName(row)}
              description={[row.User?.email, moment(row.createdAt).format('ll')].filter(Boolean).join(' · ')}
            />
          </ListItem>
        )}
      />
    </Card>
  )
}

export default CompanyUserPendingList
