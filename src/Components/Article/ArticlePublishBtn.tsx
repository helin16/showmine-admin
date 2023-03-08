import React, { ReactText, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import moment from 'moment';
import { useIntl, FormattedMessage } from 'react-intl';
import IArticle, {initialArticle} from '../../Types/Article/IArticle';
import { RootState } from '../../Redux/makeReduxStore';
import ChannelService from '../../Services/ChannelService';
import IChannel from '../../Types/Channel/IChannel';
import ChannelIcon from '../Channel/ChannelIcon';
import IError from '../../Types/IError';
import ArticleService from '../../Services/ArticleService';
import { addressVic } from '../../Types/Address/IAddress';
import Button, {iButton} from '../Form/Button';
import Spin from '../Form/Spin';
import Table from '../Form/Table';
import Modal from '../Form/Modal';
import message from '../Form/message';
import Icons from '../Icons';
import Alert from '../Form/Alert';

type iState = {
  article?: IArticle,
  showingConfirmDiv: boolean,
  publishText: string,
  saving: boolean,
  channels: IChannel[],
  selectedChannelIds: ReactText[],
  selectedChannels: IChannel[],
  channelLoading: boolean,
  channelLoadingErr?: IError,
}
const initialState: iState = {
  article: initialArticle,
  publishText: 'Publish',
  showingConfirmDiv: false,
  saving: false,
  channels: [],
  selectedChannelIds: [],
  selectedChannels: [],
  channelLoading: false,
};

type iArticlePublishBtn = iButton & {article?: IArticle, onPublished?: Function};

const ArticlePublishBtn = ({
  article, children, onPublished, ...props
}: iArticlePublishBtn) => {
  const [state, setState] = useState(initialState);
  const { company } = useSelector((s: RootState) => s.auth);
  const intl = useIntl();
  const publish = intl.formatMessage({ id: 'publish' });
  const rePublish = intl.formatMessage({ id: 're-publish' });

  useEffect(() => {
    if (!article) return;
    setState((s) => ({
      ...s,
      article,
      publishText: (article.is_draft === 1 || article.is_draft === true) ? publish : rePublish,
      showingConfirmDiv: false,
    }));
  }, [article, publish, rePublish]);

  useEffect(() => {
    if (!company || !company.id) return;
    if (state.showingConfirmDiv !== true) return;

    let isCancelled = false;
    setState((s) => ({
      ...s,
      channelLoading: false,
      channels: [],
      channelLoadingErr: undefined,
    }));
    ChannelService.getChannelsUnderCompany(company.id)
      .then((res) => {
        if (isCancelled === true) return;
        const channels = res.data;
        setState((s) => ({
          ...s,
          channelLoading: false,
          channels,
          selectedChannels: channels,
          selectedChannelIds: channels.map((channel: IChannel) => (channel.id || '')),
        }));
      })
      .catch((err) => {
        if (isCancelled === true) return;
        setState((s) => ({
          ...s,
          channelLoading: false,
          channelLoadingErr: err,
        }));
      });
    return () => { // eslint-disable-line
      isCancelled = true;
    };
  }, [state.showingConfirmDiv, company]);

  const showOrHideConfirmDiv = (showing: boolean) => {
    setState({
      ...state,
      showingConfirmDiv: showing,
    });
  };

  const confirmPublish = () => {
    if (!state.article || !state.article.id) return;
    setState({
      ...state,
      saving: true,
    });
    ArticleService.updateArticle(state.article.id, {
      ...state.article,
      address: addressVic,
      is_draft: false,
      is_published: true,
      is_sync_to_market: true,
      date_publish: moment().utc().toISOString(),
      date_start: moment().utc().toISOString(),
      selectedChannel: state.selectedChannels.map((channel: IChannel) => (channel.id || '')),
    }).then((res) => {
      message.success(intl.formatMessage({ id: 'update-success' }, { text: state.publishText }));
      setState({
        ...state,
        article: res.data,
        saving: false,
      });
      if (typeof (onPublished) === 'function') {
        onPublished(res.data);
      }
    }).catch((err) => {
      // message.error(`Error when ${state.publishText}ing: ${err.message}.`);
      message.error(intl.formatMessage({ id: 'update-error' }, { text: state.publishText, message: err.message }));
      setState({
        ...state,
        saving: false,
      });
    });
  };

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
                });
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
              typeIcon: (<ChannelIcon channel={channel} />),
            }))}
          />
        ) : (
          <Alert message={intl.formatMessage({ id: 'loading-channels-error' }, { message: state.channelLoadingErr.message })} type="error" />
        )}
      </Spin>
  );

  if (!state.article) {
    return null;
  }

  return (
    <>
      <Button {...props} onClick={() => { showOrHideConfirmDiv(true); }}>
        {children || state.publishText}
      </Button>
      {state.showingConfirmDiv !== true ? null : (
        <Modal
          open={state.showingConfirmDiv === true}
          title={intl.formatMessage({ id: 'confirm-text' }, { text: state.publishText })}
          onOk={confirmPublish}
          okText={intl.formatMessage({ id: 'yes-text' }, { text: state.publishText })}
          okButtonProps={{ type: 'primary', icon: (<Icons.CloudUploadOutlined />), loading: (state.saving === true) }}
          onCancel={() => { showOrHideConfirmDiv(false); }}
          cancelButtonProps={{ type: 'text' }}
        >
            <p>
              <FormattedMessage id="publish-alert-1" values={{ text: state.publishText }} />
              <b><FormattedMessage id="publish-alert-2" /></b>.
            </p>
          <div>
            {getChannelTable()}
          </div>
          <p>
            <FormattedMessage id="check-confirm-1" values={{ text: state.publishText }}/>
            <b>{state.selectedChannels.length}</b>
            {intl.formatMessage({ id: 'check-confirm-2' })}?
          </p>
        </Modal>
      )}
    </>
  );
};

export default ArticlePublishBtn;
