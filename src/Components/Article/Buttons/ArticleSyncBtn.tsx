import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import moment from 'moment';
import IArticle, {initialArticle} from '../../../Types/Article/IArticle';
import { RootState } from '../../../Redux/makeReduxStore';
import ICompany from '../../../Types/Company/ICompany';
import IError from '../../../Types/IError';
import ArticleService from '../../../Services/ArticleService';
import IArticleSyncStatusItem from '../../../Types/Article/IArticleSyncStatusItem';
import IResList, {InitialList} from '../../../Types/IResList';
import Utils from '../../../Services/Utils';
import translate from '../../../i18n/translate';
import Button, {iButton} from '../../Form/Button';
import Tag from '../../Form/Tag';
import Table from '../../Form/Table';
import Modal from '../../Form/Modal';
import Spin from '../../Form/Spin';

type iState = {
  article?: IArticle,
  company?: ICompany,
  showingDiv: boolean,
  loading: boolean,
  loadingMore: boolean,
  loadingErr?: IError,
  statusItems: IResList<IArticleSyncStatusItem>,
  pageNo: number,
}
const initialState: iState = {
  pageNo: 1,
  article: initialArticle,
  company: undefined,
  showingDiv: false,
  loading: true,
  loadingMore: false,
  statusItems: InitialList,
};

const ArticleSyncBtn = ({ article, children, ...props }: iButton & {article?: IArticle}) => {
  const [state, setState] = useState(initialState);
  const { company } = useSelector((s: RootState) => s.auth);

  const columns = [
    {
      title: translate('name'),
      dataIndex: ['channel', 'name'],
      key: 'name',
      render: (name: string) => <p>{name}</p>,
    },
    {
      title: translate('channel'),
      dataIndex: ['channel', 'type'],
      key: 'channel',
      render: (type: string) => <p>{type}</p>,
    },
    {
      title: translate('date'),
      dataIndex: 'created_at', // eslint-disable-line
      key: 'date',
      render: (created_at: string) => ( // eslint-disable-line
        <div>
          <b>{moment(created_at).format('lll')} <small>[{moment(created_at).fromNow()}]</small></b>
        </div>
      ),
    },
    {
      title: translate('sync-status'),
      key: 'status',
      render: (record: IArticleSyncStatusItem) => {
        let color = 'volcano';
        if (record.status !== 'FAILED') {
          color = 'green';
        }
        return <div>
            <Tag color={color} key={'tag'}>
              {record.status.toUpperCase()}
            </Tag>
            { record.message ? <p>{record.message}</p> : null }
        </div>;
      },
    },
  ];

  useEffect(() => {
    if (!article) return;
    const comp = (article.company || company);
    setState((s) => ({
      ...s,
      article,
      company: comp === null ? undefined : comp,
      showingDiv: false,
    }));
  }, [article, company]);

  useEffect(() => {
    if (state.showingDiv !== true || !state.article || !state.article.id) return;

    setState((s) => ({
      ...s,
      loading: state.pageNo === 1,
      loadingMore: state.pageNo > 1,
      loadingErr: undefined,
    }));
    let isCancelled = false;
    ArticleService.getSyncStatus(state.article.id, { page: state.pageNo })
      .then((res) => {
        if (isCancelled === true) return;
        setState((s) => ({
          ...s,
          loading: false,
          loadingMore: false,
          statusItems: Utils.concatIRestList(s.statusItems, res.data),
        }));
      })
      .catch((err) => {
        if (isCancelled === true) return;
        setState((s) => ({
          ...s,
          loading: false,
          loadingMore: false,
          loadingErr: err,
        }));
      });
    return () => { // eslint-disable-line
      isCancelled = true;
    };
  }, [state.showingDiv, state.article, state.pageNo]);

  const showOrHideConfirmDiv = (showing: boolean) => {
    setState({
      ...state,
      showingDiv: showing,
    });
  };

  const pageChange = (pageNo: number) => {
    setState({
      ...state,
      pageNo,
    });
  };

  const getStatusPanel = () => {
    const data = state.statusItems.data.map((item, index) => {
      const obj = { ...item };
      obj.key = item.id || index.toString();
      return obj;
    });
    const paginationProps = {
      showSizeChanger: false,
      showQuickJumper: false,
      showTotal: (total: number) => translate('total-items', { total }),
      pageSize: state.statusItems.per_page,
      current: state.statusItems.current_page,
      total: state.statusItems.total,
      onChange: (current: number) => {
        pageChange(current);
      },
    };
    return <Table columns={columns} dataSource={data} pagination={paginationProps} />;
  };

  if (!state.article) {
    return null;
  }

  return (
    <>
      <Button {...props} onClick={() => { showOrHideConfirmDiv(true); }}>
        {children || translate('sync-status')}
      </Button>
      {state.showingDiv !== true ? null : (
        <Modal
          open={state.showingDiv === true}
          title={`${translate('sync-status')}:`}
          footer={null}
          width={'50%'}
          onCancel={() => { showOrHideConfirmDiv(false); }}
        >
          <Spin spinning={state.loading}>
            {getStatusPanel()}
          </Spin>
        </Modal>
      )}
    </>
  );
};

export default ArticleSyncBtn;
