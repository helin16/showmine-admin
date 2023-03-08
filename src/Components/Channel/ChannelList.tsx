import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import moment from 'moment';
import ICompany from '../../Types/Company/ICompany';
import IChannel from '../../Types/Channel/IChannel';
import ChannelService from '../../Services/ChannelService';
import { CHANNEL_TYPE_SHOW_MINE } from '../../Constants';
import ChannelIcon from './ChannelIcon';
import ChannelPopupEditor from './ChannelPopupEditor';
import translate from '../../i18n/translate';
import message from '../Form/message';
import Tooltip from '../Form/Tooltip';
import Tag from '../Form/Tag';
import Switch from '../Form/Switch';
import Button from '../Form/Button';
import List, {ListItem, ListItemMeta} from '../Form/List';
import Icons from '../Icons';
import PopConfirm from '../Form/Popconfirm';
import Spin from '../Form/Spin';

const ChannelListWrapper = styled.div`

`;

type iState = {
  loading: boolean,
  mainChannelId?: string,
  list: IChannel[],
  updatingChannelId: string;
}
const initialState: iState = {
  loading: false,
  list: [],
  updatingChannelId: '',
};
const ChannelList = ({ company }: {company: ICompany}) => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    if (!company.id) return;
    setState((s) => ({
      ...s,
      loading: true,
    }));
    let isCancelled = false;
    ChannelService.getChannelsUnderCompany(company.id)
      .then((res) => {
        if (isCancelled === true) return;
        setState((s) => ({
          ...s,
          loading: false,
          list: res.data.sort((a: IChannel, b: IChannel) => (a.name >= b.name ? 1 : 0)),
        }));
      })
      .catch((err) => {
        if (isCancelled === true) return;
        message.error(translate('error-getting-channel', { message: err.response.data.message }));
        setState((s) => ({
          ...s,
          loading: false,
          list: [],
        }));
      });
    return () => { // eslint-disable-line
      isCancelled = true;
    };
  }, [company.id, state.mainChannelId]);

  const removeChannel = (channel: IChannel) => {
    if (!channel.id) return;
    setState({
      ...state,
      updatingChannelId: channel.id,
    })
    ChannelService.deleteChannel(channel.id)
      .then((res) => {
        if (res.data.success === true) {
          message.success(translate('channel-deleted', { name: channel.name }));
          setState({
            ...state,
            list: state.list.filter((chan: IChannel) => (chan.id !== channel.id)),
            mainChannelId: undefined,
          });
        }
      })
      .catch((err) => {
        message.error(translate('error-channel-delete', { name: channel.name, message: err.response.data.message }));
      })
      .finally(() => {
        setState({
          ...state,
          updatingChannelId: '',
        })
      });
  };

  const changeChannelToMain = (channel: IChannel, isMainChannel: boolean) => {
    if (!channel.id) return;
    ChannelService.updateChannel(channel.id, { ...channel, isMainChannel })
      .then((res) => {
        if (res.data.success === true) {
          message.success(translate('channel-updated', { name: channel.name }));
          setState({
            ...state,
            mainChannelId: channel.id || '',
          });
        }
      })
      .catch((err) => {
        message.error(translate('error-channel-update', { name: channel.name, message: err.response.data.message }));
      });
  };

  return (
    <ChannelListWrapper>
      <Spin spinning={`${state.updatingChannelId || ''}`.trim() !== ''}>
        <List
          className="channel-list"
          loading={state.loading}
          itemLayout="horizontal"
          dataSource={state.list}
          renderItem={(channel: IChannel, index) => (
            <ListItem
              actions={[
                (
                  <div>
                    {channel.valid === 1 ? (
                      <Tooltip placement="topLeft" title={translate('channel-valid')}>
                        <Tag color={'green'}>
                          {translate('valid')}
                        </Tag>
                      </Tooltip>
                    ) : (
                      <Tag color={'#f0f0f0'} title={translate('channel-invalid')}>
                        {translate('invalid')}
                      </Tag>
                    )}
                  </div>
                ),
                (
                  <Switch
                    checkedChildren={translate('main')}
                    unCheckedChildren={translate('not-main')}
                    checked={channel.isMainChannel === 1}
                    onChange={(e: boolean) => changeChannelToMain(channel, e)}
                    disabled={channel.isMainChannel === 1}
                    loading={channel.id === state.updatingChannelId}
                  />
                ),
                (
                  <PopConfirm
                    title={<div>{translate('confirm-delete', { text: channel.name })}</div>}
                    onConfirm={() => {
                      removeChannel(channel);
                    }}
                    okText={translate('yes')}
                    cancelText={translate('no')}
                  >
                    <Button danger type="text"
                      style={{
                        visibility: (channel.name.toLowerCase() === CHANNEL_TYPE_SHOW_MINE.toLowerCase() ? 'hidden' : 'visible'),
                      }}>
                      <Icons.DeleteOutlined/>
                      { translate('delete') }
                    </Button>
                  </PopConfirm>
                ),
              ]}
            >
              <ListItemMeta
                avatar={<ChannelIcon channel={channel} />}
                title={<ChannelPopupEditor channel={channel}>{channel.name}</ChannelPopupEditor>}
                description={
                  <div>{moment(channel.created_at).format('ll')}</div>
                }
              />
            </ListItem>
          )}
        />
      </Spin>
    </ChannelListWrapper>
  );
};


export default ChannelList;
