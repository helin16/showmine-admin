import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import IArticle, {initialArticle} from '../../../Types/Article/IArticle';
import ArticleService from '../../../Services/ArticleService';
import Button, {iButton} from '../../Form/Button';
import message from '../../Form/message';
import Modal from '../../Form/Modal';
import Icons from '../../Icons';

type iState = {
  article?: IArticle,
  showingConfirmDiv: boolean,
  deleting: boolean,
}
const initialState: iState = {
  article: initialArticle,
  showingConfirmDiv: false,
  deleting: false,
};

const ArticleDeleteBtn = ({
  article, children, onDeleted, ...props
}: iButton & {article?: IArticle, onDeleted?: Function}) => {
  const [state, setState] = useState(initialState);
  const intl = useIntl();

  useEffect(() => {
    if (!article) return;
    setState((s) => ({
      ...s,
      article,
      showingConfirmDiv: false,
    }));
  }, [article]);

  const confirmDelete = () => {
    if (!state.article || !state.article.id) return;

    setState({
      ...state,
      deleting: true,
    });
    ArticleService.deleteArticle(state.article.id)
      .then((res) => {
        message.success('Content deleted.');
        setState({
          ...state,
          deleting: false,
          showingConfirmDiv: false,
        });
        if (typeof (onDeleted) === 'function') {
          onDeleted(res.data);
        }
      })
      .catch((err) => {
        message.error(`Error when deleting ${err.message}`);
      });
  };

  const showOrHideConfirmDiv = (showing: boolean) => {
    setState({
      ...state,
      showingConfirmDiv: showing,
    });
  };

  if (!state.article) {
    return null;
  }

  return (
    <>
      <Button {...props} onClick={() => { showOrHideConfirmDiv(true); }}>
        {children || intl.formatMessage({ id: 'delete' })}
      </Button>
      {state.showingConfirmDiv !== true ? null : (
        <Modal
          open={state.showingConfirmDiv === true}
          title={intl.formatMessage({ id: 'are_you_sure' })}
          onOk={confirmDelete}
          okText={intl.formatMessage({ id: 'yes_delete' })}
          okButtonProps={{ danger: true, icon: (<Icons.DeleteOutlined />), loading: (state.deleting === true) }}
          onCancel={() => { showOrHideConfirmDiv(false); }}
          cancelButtonProps={{ type: 'text' }}
        >
          <p>{intl.formatMessage({ id: 'notice_delete_1' })}, <b>{intl.formatMessage({ id: 'notice_delete_2' })}</b>.</p>
          <p>{intl.formatMessage({ id: 'notice_delete_3' })}</p>
        </Modal>
      )}
    </>
  );
};


export default ArticleDeleteBtn;
