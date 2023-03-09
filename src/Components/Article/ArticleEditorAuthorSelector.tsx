import React, {useEffect, useState} from 'react';
import styled from 'styled-components';
import IArticle from '../../Types/Article/IArticle';
import ArticleService from '../../Services/ArticleService';
import Select from '../Form/Select';
import Typography from '../Form/Typography';
import message from '../Form/message';
import CompanyService from '../../Services/CompanyService';
import ICompanyAuthor from '../../Types/Company/ICompanyAuthor';
import Spin from '../Form/Spin';
import {FlexContainer} from '../../Styles/AppWrapper';
import Button from '../Form/Button';
import Icons from '../Icons';

const ArticleAuthorSelectorDiv = styled.div``;

type iArticleEditorAuthorSelector = {
  article: IArticle,
  onUpdated?: (newArticle: IArticle) => void;
  onSetIsSaving?: (saving: boolean) => void;
}

type iAuthorsMap = {[key: string]: ICompanyAuthor};
type iState = {
  isLoading: boolean;
  isSaving: boolean;
  authorsMap: iAuthorsMap;
};

const initState: iState = {
  isLoading: false,
  isSaving: false,
  authorsMap: {},
}
const ArticleEditorAuthorSelector = ({ article, onUpdated, onSetIsSaving } : iArticleEditorAuthorSelector) => {
  const [state, setState] = useState(initState);

  useEffect(() => {
    const companyId = `${article.company_id || ''}`.trim();
    if (companyId === '') {
      return;
    }

    let isCanceled = false;
    setState((s) => ({
      ...s,
      isLoading: true,
    }))
    CompanyService.getCompanyDetails(companyId)
      .then(resp => {
        if (isCanceled === true) return;
        const companyData = resp.data || {};
        setState((s) => ({
          ...s,
          isLoading: false,
          authorsMap: (!companyData.configObj || !('authorInfo' in companyData.configObj))
            ? {}
            : companyData.configObj.authorInfo.reduce((map: iAuthorsMap, authorInfo: ICompanyAuthor) => {
              return {
                ...map,
                [authorInfo.author]: authorInfo,
              }
            }, {}),
        }))
      })
      .catch(err => {
        if (isCanceled === true) return;
        message.error(err.response.data.message);
        setState((s) => ({
          ...s,
          isLoading: false,
        }))
      })
    return () => {
      isCanceled = true;
    }

  }, [article.company_id])

  const authorSelected = (newAuthor: string) => {
    if (!article.id) {
      message.error('Error when update author: invalid article. Please refresh your page and try again.');
      return;
    }
    const authorInfo = state.authorsMap[newAuthor] || {};
    const authorName = `${authorInfo.author || ''}`.trim();
    const authorLink = `${authorInfo.authorLink || ''}`.trim();
    if (authorName === '') {
      message.error('Invalid Author name');
      return;
    }

    if (onSetIsSaving) {
      onSetIsSaving(true);
    }
    setState({
      ...state,
      isSaving: true,
    })
    // @ts-ignore
    ArticleService.updateArticle(article.id, {
        date_expiry: article.date_expiry,
        is_draft: article.is_draft,
        address: article.address,
        author: authorName,
        company_id: article.company_id,
        config: JSON.stringify({
          ...article.configObj,
          authorLinks: authorLink,
        }),
      })
      .then((res) => {
        message.success('Author Updated.');
        setState({
          ...state,
          isSaving: true,
        });
        if (typeof (onUpdated) === 'function') {
          onUpdated(res.data);
        }
      })
      .catch((err) => {
        message.error(`Error when update author: ${err.message}`);
        setState({
          ...state,
          isSaving: true,
        });
      })
      .finally(() => {
        onSetIsSaving && onSetIsSaving(false);
      });
  };

  const getSelectedAuthorLink = () => {
    const url = `${state.authorsMap[article.author]?.authorLink || ''}`.trim();
    if (url === '') {
      return null;
    }
    return (
      <FlexContainer className={'justify-content-space-between'}>
        <Button size={'small'} type={'link'} title={'force update author'} onClick={() => authorSelected(article.author)}><Icons.ReloadOutlined /></Button>
        <a href={url} target={'__blank'}>
          <Typography.Text type="secondary">{url}</Typography.Text>
        </a>
      </FlexContainer>
    )
  }

  return (
    <ArticleAuthorSelectorDiv>
      <Spin spinning={state.isLoading}>
        <Select
          // labelInValue
          showSearch
          value={state.authorsMap[article.author]?.author}
          style={{ width: '100%' }}
          onChange={authorSelected}
          filterOption={(input: string, option: any) => { // eslint-disable-line
            if (!option) {
              return false;
            }
            if (!state.authorsMap[option.key]) {
              return false;
            }
            const author = state.authorsMap[option.key];
            const name = `${author.author || ''}${author.authorLink || ''}`.toLowerCase();
            return name.indexOf(input.toLowerCase()) >= 0;
          }}
          options={
            Object.keys(state.authorsMap).map((authorName: string) => ({
              label: (
                <div>
                  <div><b>{authorName}</b></div>
                  <div>{state.authorsMap[authorName].authorLink}</div>
                </div>
              ),
              value: authorName,
              key: authorName,
            }))
          }
        />
        {getSelectedAuthorLink()}
      </Spin>
    </ArticleAuthorSelectorDiv>
  );
};


export default ArticleEditorAuthorSelector;
