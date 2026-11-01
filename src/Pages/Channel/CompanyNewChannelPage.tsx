import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { CHANNEL_SCRIPT_WECHAT_OFFICIAL, CHANNEL_TYPE_SHOW_MINE } from '../../Constants'
import { COMPANY_CHANNELS_URL } from '../../UrlMap'
import translate from '../../i18n/translate'
import { inlineInputBgColor } from '../../Styles/AppWrapper'
import { useNavigate } from 'react-router-dom'
import ChannelIcon from '../../Components/Channel/ChannelIcon'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import Card from '../../Components/Form/Card'
import Button from '../../Components/Form/Button'
import ChannelEditor from '../../Components/Channel/ChannelEditor'
import List, { ListItem, ListItemMeta } from '../../Components/Form/List'
import Icons from '../../Components/Icons'
import Alert from '../../Components/Form/Alert'
import ChannelScriptService from '../../Services/ChannelScriptService'
import IChannelScript from '../../Types/Channel/IChannelScript'
import Utils from '../../Services/Utils'

const NewChannelWrapper = styled.div`
  .channel-list-item {
    cursor: pointer;
    :hover {
      background: ${inlineInputBgColor};
    }
  }
`

type iState = {
  loading: boolean
  loadingErr?: string
  scripts: IChannelScript[]
  selectedScriptId?: string
}
const initialState: iState = {
  loading: false,
  scripts: [],
}
const CompanyNewChannelPage = () => {
  const [state, setState] = useState(initialState)
  const navigate = useNavigate()

  useEffect(() => {
    setState((s) => ({
      ...s,
      loading: true,
      loadingErr: undefined,
    }))
    let isCancelled = false
    // A channel needs a scriptId, so only scripts the API has, and that have a working editor, can be offered.
    ChannelScriptService.getAll({
      where: JSON.stringify({ isActive: true }),
      perPage: 9999,
      currentPage: 1,
    })
      .then((res) => {
        if (isCancelled === true) return
        setState((s) => ({
          ...s,
          loading: false,
          scripts: res.data.filter((script: IChannelScript) => script.script === CHANNEL_SCRIPT_WECHAT_OFFICIAL),
        }))
      })
      .catch((err) => {
        if (isCancelled === true) return
        setState((s) => ({
          ...s,
          loading: false,
          loadingErr: translate('error-getting-channel', { message: Utils.getErrorMessage(err) }),
        }))
      })
    return () => {
      isCancelled = true
    }
  }, [])

  const selectAScript = (script: IChannelScript) => {
    setState((s) => ({
      ...s,
      selectedScriptId: script.id,
    }))
  }

  const unSelectAScript = () => {
    setState((s) => ({
      ...s,
      selectedScriptId: undefined,
    }))
  }

  const handleOnCancel = () => {
    navigate(COMPANY_CHANNELS_URL)
  }

  const channelIcon = { type: CHANNEL_TYPE_SHOW_MINE }
  const channelType = translate('channel-type-wechat')

  const getChannelList = () => {
    if (state.loadingErr) {
      return <Alert type='error' message={state.loadingErr} />
    }
    return (
      <List
        className='channel-type-list'
        loading={state.loading}
        itemLayout='horizontal'
        dataSource={state.scripts}
        renderItem={(script: IChannelScript) => (
          <ListItem
            className={'channel-list-item'}
            onClick={() => selectAScript(script)}
            extra={<Icons.RightOutlined />}
          >
            <ListItemMeta
              avatar={<ChannelIcon channel={channelIcon} />}
              title={channelType}
              description={
                <div>
                  {translate('click-connect')}
                  <b>{channelType}</b>
                </div>
              }
            />
          </ListItem>
        )}
      />
    )
  }

  return (
    <BackendPage
      selectedMenu={''}
      ContentHeader={
        <BackendPageContentTitle
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span>{translate('connect-new')}</span>
              {!state.selectedScriptId ? null : <ChannelIcon channel={channelIcon} style={{ margin: '0 10px' }} />}
              <span>{translate('channel')}</span>
            </div>
          }
        />
      }
    >
      <Card>
        <NewChannelWrapper>
          {!state.selectedScriptId ? (
            getChannelList()
          ) : (
            <ChannelEditor
              channel={{ name: '', scriptId: state.selectedScriptId }}
              onSaved={handleOnCancel}
              onCancel={unSelectAScript}
            />
          )}
        </NewChannelWrapper>
      </Card>
      {!state.selectedScriptId ? (
        <div style={{ textAlign: 'right' }}>
          <Button type={'link'} onClick={handleOnCancel}>
            {translate('cancel')}
          </Button>
        </div>
      ) : null}
    </BackendPage>
  )
}

export default CompanyNewChannelPage
