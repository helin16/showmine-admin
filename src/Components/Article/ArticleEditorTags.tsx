import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import IArticle from '../../Types/Article/IArticle';
import ICompany from '../../Types/Company/ICompany';
import CompanyService from '../../Services/CompanyService';
import ITag from '../../Types/Tag/ITag';
import Utils from '../../Services/Utils';
import message from '../Form/message';
import Select from '../Form/Select';
import * as _ from 'lodash';

type iState = {
  loading: boolean,
  tagsMap: { [key: string]: ITag },
}
const initState: iState = {
  tagsMap: {},
  loading: false,
};

type iArticleEditorTags = {
  article: IArticle,
  company: ICompany,
  onUpdate: (fieldName: string, newValue: any, onSaved?: (newArticle: IArticle) => void) => void,
}
/**
 *
 */
const ArticleEditorTags = ({ article, company, onUpdate }: iArticleEditorTags) => {
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
      loading: true,
    }));
    CompanyService.getCompanyTags(company.id)
      .then((res) => {
        if (isCancelled === true) return;
        setState((s) => ({
          ...s,
          tagsMap: res.data.reduce((map: { [key: string]: ITag }, tag: ITag) => {
            return {
              ...map,
              [tag.name]: tag,
            }
          }, {}),
        }));
      })
      .catch((error) => {
        if (isCancelled === true) return;
        message.error(error.response.data.message)
      })
      .finally(() => {
        if (isCancelled === true) return;
        setState((s) => ({
          ...s,
          loading: false,
        }));
      });
    return () => { // eslint-disable-line
      isCancelled = true;
    };
  }, [article, company]);

  const tagsChanged = (value: any) => { // eslint-disable-line
    console.log('article.id', article.id);
    console.log('article.company_tags', article.company_tags);
    const currentTagNames =  _.uniq(article.tags.map((tag: ITag) => tag.name));
    console.log('currentTagNames', currentTagNames);
    if (!article.id) {
      return;
    }
    if (Utils.compareArrays(value, currentTagNames)) {
      return;
    }
    // console.log('value', value);
    onUpdate(
      'tagNames',
      value
    )

    // ArticleService.updateArticle(state.article.id, newArticle)
    //   .then((res) => {
    //     setState({
    //       ...state,
    //       selectedTags: value,
    //       article: {
    //         ...state.article,
    //         ...res.data,
    //       },
    //     });
    //     message.success(intl.formatMessage({ id: 'tag-success' }));
    //     if (typeof (onUpdated) === 'function') {
    //       onUpdated(res.data);
    //     }
    //   })
    //   .catch((err) => {
    //     message.error(intl.formatMessage({ id: 'tag-error' }, { text: err.message }));
    //   });
  };

  return (
    <div className={'article-editor-tags-wrapper'}>
      <Select mode="tags" style={{ width: '100%' }}
        value={ article.tags ? _.uniq(article.tags.map((tag: ITag) => tag.name)) : []}
        placeholder={ `${intl.formatMessage({ id: 'tags' })}...` }
        onChange={tagsChanged}
        options={Object.values(state.tagsMap).map((tag: ITag, index: number) => {
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
