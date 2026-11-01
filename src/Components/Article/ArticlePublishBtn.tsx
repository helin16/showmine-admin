import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import moment from 'moment'
import { useIntl, FormattedMessage } from 'react-intl'
import IArticle from '../../Types/Article/IArticle'
import { RootState } from '../../Redux/makeReduxStore'
import ChannelService from '../../Services/ChannelService'
import IChannel from '../../Types/Channel/IChannel'
import ChannelIcon from '../Channel/ChannelIcon'
import IError from '../../Types/IError'
import ArticleService from '../../Services/ArticleService'
import Button, { iButton } from '../Form/Button'
import Spin from '../Form/Spin'
import Table from '../Form/Table'
import Modal from '../Form/Modal'
import message from '../Form/message'
import Icons from '../Icons'
import Alert from '../Form/Alert'

type iState = {
  showingConfirmDiv: boolean
  publishText: string
  saving: boolean
  channels: IChannel[]
  selectedChannelIds: React.Key[]
  selectedChannels: IChannel[]
  channelLoading: boolean
  channelLoadingErr?: IError
}
const initialState: iState = {
  publishText: 'Publish',
  showingConfirmDiv: false,
  saving: false,
  channels: [],
  selectedChannelIds: [],
  selectedChannels: [],
  channelLoading: false,
}

type iArticlePublishBtn = iButton & { article?: IArticle; onPublished?: (savedItem: IArticle) => void }

const ArticlePublishBtn = ({ article, children, onPublished, ...props }: iArticlePublishBtn) => {
  const [state, setState] = useState(initialState)
  const { company, user: currentUser } = useSelector((s: RootState) => s.auth)
  const intl = useIntl()
  const publish = intl.formatMessage({ id: 'publish' })
  const rePublish = intl.formatMessage({ id: 're-publish' })

  useEffect(() => {
    if (!article) return
    setState((s) => ({
      ...s,
      article,
      publishText: article.isPublished === true ? rePublish : publish,
      showingConfirmDiv: false,
    }))
  }, [article, publish, rePublish])

  useEffect(() => {
    if (!company || !company.id) return
    if (!state.showingConfirmDiv) return

    let isCancelled = false
    setState((s) => ({
      ...s,
      channelLoading: true,
      channels: [],
      channelLoadingErr: undefined,
    }))
    ChannelService.getAll()
      .then((res) => {
        if (isCancelled === true) return
        const channels = res.data
        setState((s) => ({
          ...s,
          channelLoading: false,
          channels,
          selectedChannels: channels,
          selectedChannelIds: channels.map((channel: IChannel) => channel.id || ''),
        }))
      })
      .catch((err) => {
        if (isCancelled === true) return
        setState((s) => ({
          ...s,
          channelLoading: false,
          channelLoadingErr: err,
        }))
      })
    return () => {
      // eslint-disable-line
      isCancelled = true
    }
  }, [state.showingConfirmDiv, company])

  const showOrHideConfirmDiv = (showing: boolean) => {
    setState({
      ...state,
      showingConfirmDiv: showing,
    })
  }

  const confirmPublish = () => {
    const currentUserId = `${currentUser?.id || ''}`.trim()
    const currentArticleId = `${article?.id || ''}`.trim()
    if (currentUserId === '' || currentArticleId === '') {
      message.error(intl.formatMessage({ id: currentUserId === '' ? 'not-authorize' : 'invalid-content' }))
      return
    }
    setState({
      ...state,
      saving: true,
    })
    ArticleService.update(currentArticleId, {
      publishedAt: moment().utc().toISOString(),
      publishedById: currentUserId,
      selectedChannel: state.selectedChannels.map((channel: IChannel) => channel.id || ''),
    })
      .then((res) => {
        message.success(intl.formatMessage({ id: 'update-success' }, { text: state.publishText }))
        setState({
          ...state,
          saving: false,
        })
        if (typeof onPublished === 'function') {
          onPublished(res)
        }
      })
      .catch((err) => {
        // message.error(`Error when ${state.publishText}ing: ${err.message}.`);
        message.error(intl.formatMessage({ id: 'update-error' }, { text: state.publishText, message: err.message }))
        setState({
          ...state,
          saving: false,
        })
      })
  }

  const getChannelTable = () => (
    <Spin spinning={state.channelLoading === true}>
      {!state.channelLoadingErr ? (
        <Table
          scroll={{ y: 240 }}
          pagination={false}
          rowSelection={{
            selectedRowKeys: state.selectedChannelIds,
            onChange: (selectedRowKeys, selectedRows) => {
              setState({
                ...state,
                selectedChannelIds: selectedRowKeys,
                selectedChannels: selectedRows,
              })
            },
          }}
          columns={[
            {
              title: '',
              dataIndex: 'typeIcon',
              width: '12%',
            },
            {
              title: intl.formatMessage({ id: 'table-name' }),
              dataIndex: 'name',
            },
          ]}
          dataSource={state.channels.map((channel: IChannel) => ({
            ...channel,
            key: channel.id,
            typeIcon: <ChannelIcon channel={channel} />,
          }))}
        />
      ) : (
        <Alert
          message={intl.formatMessage({ id: 'loading-channels-error' }, { message: state.channelLoadingErr.message })}
          type='error'
        />
      )}
    </Spin>
  )

  if (!article) {
    return null
  }

  return (
    <>
      <Button
        {...props}
        onClick={() => {
          showOrHideConfirmDiv(true)
        }}
      >
        {children || state.publishText}
      </Button>
      {state.showingConfirmDiv !== true ? null : (
        <Modal
          open={state.showingConfirmDiv === true}
          title={intl.formatMessage({ id: 'confirm-text' }, { text: state.publishText })}
          onOk={confirmPublish}
          okText={intl.formatMessage({ id: 'yes-text' }, { text: state.publishText })}
          okButtonProps={{
            type: 'primary',
            icon: <Icons.CloudUploadOutlined />,
            loading: state.saving === true,
            disabled: state.channelLoading === true || !!state.channelLoadingErr,
          }}
          onCancel={() => {
            showOrHideConfirmDiv(false)
          }}
          cancelButtonProps={{ type: 'text' }}
        >
          <p>
            <FormattedMessage id='publish-alert-1' values={{ text: state.publishText }} />
            <b>
              <FormattedMessage id='publish-alert-2' />
            </b>
            .
          </p>
          <div>{getChannelTable()}</div>
          <p>
            <FormattedMessage id='check-confirm-1' values={{ text: state.publishText }} />
            <b>{state.selectedChannels.length}</b>
            {intl.formatMessage({ id: 'check-confirm-2' })}?
          </p>
        </Modal>
      )}
    </>
  )
}

export default ArticlePublishBtn
