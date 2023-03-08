import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import IArticle, {initialArticle} from '../../../Types/Article/IArticle';
import VisitStats from '../../Stats/VisitStats';
import { RootState } from '../../../Redux/makeReduxStore';
import ICompany from '../../../Types/Company/ICompany';
import Button, {iButton} from '../../Form/Button';
import Modal from '../../Form/Modal';

type iState = {
  article?: IArticle,
  company?: ICompany,
  showingDiv: boolean,
}
const initialState: iState = {
  article: initialArticle,
  company: undefined,
  showingDiv: false,
};

const ArticleStatsBtn = ({ article, children, ...props }: iButton & {article?: IArticle}) => {
  const [state, setState] = useState(initialState);
  const { company } = useSelector((s: RootState) => s.auth);
  const intl = useIntl();

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

  const showOrHideConfirmDiv = (showing: boolean) => {
    setState({
      ...state,
      showingDiv: showing,
    });
  };

  if (!state.article) {
    return null;
  }

  return (
    <>
      <Button {...props} onClick={() => { showOrHideConfirmDiv(true); }}>
        {children || intl.formatMessage({ id: 'visit_stat' })}
      </Button>
      {state.showingDiv !== true ? null : (
        <Modal
          open={state.showingDiv === true}
          title={`${intl.formatMessage({ id: 'visit_stat' })}:`}
          footer={null}
          width={'80%'}
          onCancel={() => { showOrHideConfirmDiv(false); }}
        >
          <VisitStats company={state.company} article={state.article}/>
        </Modal>
      )}
    </>
  );
};

export default ArticleStatsBtn;
