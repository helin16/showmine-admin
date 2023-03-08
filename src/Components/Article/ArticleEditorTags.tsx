import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import IArticle, {initialArticle} from '../../Types/Article/IArticle';
import ICompany from '../../Types/Company/ICompany';
import CompanyService from '../../Services/CompanyService';
import ITag from '../../Types/Tag/ITag';
import IError from '../../Types/IError';
import ArticleService from '../../Services/ArticleService';
import Utils from '../../Services/Utils';
import message from '../Form/message';
import Select from '../Form/Select';

type iState = {
  article: IArticle,
  loading: boolean,
  loadingErr?: IError,
  tags: Array<ITag>,
  selectedTags: Array<string>,
}
const initState: iState = {
  article: initialArticle,
  tags: [],
  selectedTags: [],
  loading: false,
};
/**
 *
 */
const ArticleEditorTags = ({ article, company, onUpdated }: {article: IArticle, company: ICompany, onUpdated?: Function }) => {
  const [state, setState] = useState(initState);
  const intl = useIntl();
  /**
   *
   */
  useEffect(() => {
    if (!company.id) return;
    let isCancelled = false;
    setState((s) => ({
      ...s,
      article,
      selectedTags: article.tags ? article.tags.map((tag: ITag) => tag.name) : [],
      company,
      loading: true,
      loadingErr: undefined,
    }));
    CompanyService.getCompanyTags(company.id)
      .then((res) => {
        if (isCancelled === true) return;
        setState((s) => ({
          ...s,
          tags: res.data,
          loading: false,
          loadingErr: undefined,
        }));
      })
      .catch((error) => {
        if (isCancelled === true) return;
        setState((s) => ({
          ...s,
          loading: false,
          loadingErr: error.data,
        }));
      });
    return () => { // eslint-disable-line
      isCancelled = true;
    };
  }, [article, company]);

  const tagsChanged = (value: any) => { // eslint-disable-line
    if (Utils.compareArrays(value, state.article.company_tags)) {
      return;
    }
    const newArticle = {
      ...state.article,
      company_tags: value,
      tagNames: [],
    };
    if (!state.article.id) {
      return;
    }
    ArticleService.updateArticle(state.article.id, newArticle)
      .then((res) => {
        setState({
          ...state,
          selectedTags: value,
          article: {
            ...state.article,
            ...res.data,
          },
        });
        message.success(intl.formatMessage({ id: 'tag-success' }));
        if (typeof (onUpdated) === 'function') {
          onUpdated(res.data);
        }
      })
      .catch((err) => {
        message.error(intl.formatMessage({ id: 'tag-error' }, { text: err.message }));
      });
  };

  return (
    <div className={'article-editor-tags-wrapper'}>
      <Select mode="tags" style={{ width: '100%' }}
        value={state.selectedTags}
        placeholder={ `${intl.formatMessage({ id: 'tags' })}...` }
        onChange={tagsChanged}
        options={state.tags.filter(tag => tag !== undefined).map((tag: ITag, index: number) => {
          return {
            label: tag.name,
            value: tag.name,
            key: index,
          }
        })}
      />
    </div>
  );
};

export default ArticleEditorTags;
