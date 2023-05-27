import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import IArticle from '../../Types/Article/IArticle'
import Select from '../Form/Select'
import Typography from '../Form/Typography'
import message from '../Form/message'
import Spin from '../Form/Spin'
import { FlexContainer } from '../../Styles/AppWrapper'
import IAuthor from '../../Types/Article/IAuthor';
import AuthorService from '../../Services/AuthorService';
import {FormattedMessage} from 'react-intl';
import CompanyAuthorPopup from '../Company/CompanyAuthorPopup';
import MathHelper from '../../Helpers/MathHelper';

const ArticleAuthorSelectorDiv = styled.div``

type iArticleEditorAuthorSelector = {
  article: IArticle;
  showCreate?: boolean;
  onUpdate: (newFieldName: string, newValue: string) => void;
}

const createId = 'app-create';

const ArticleEditorAuthorSelector = ({ article, showCreate = false, onUpdate }: iArticleEditorAuthorSelector) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authorsMap, setAuthorsMap] = useState<{ [key: string]: IAuthor }>({});
  const [isCreatingAuthor, setIsCreatingAuthor] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let isCanceled = false;
    setIsLoading(true);
    AuthorService.getAll({
      where: JSON.stringify({ isActive: true })
    }).then(res => {
      if (isCanceled) return;
      setIsCreatingAuthor(false);
      setAuthorsMap(res.data.reduce((map, author) => {
        return {
          ...map,
          [author.id || '']: author,
        }
      }, {}))
    }).catch(err => {
      if (isCanceled) return;
      message.error(`Error: ${err.response?.data?.message || ''}`);
    }).finally(() => {
      if (isCanceled) return;
      setIsLoading(false);
    })
    return () => {
      isCanceled = true;
    }
  }, [article.id, count])

  const authorSelected = (newAuthorId: string) => {
    const authorId = `${newAuthorId || ''}`.trim();
    if (authorId === '') {
      return;
    }
    if(authorId === createId) {
      setIsCreatingAuthor(true);
      return;
    }
    onUpdate('authorId', newAuthorId);
  };

  const getSelectedAuthorLink = () => {
    const selectedAuthorId = `${article.authorId || ''}`.trim();
    const url = `${authorsMap[selectedAuthorId]?.url || ''}`.trim();
    if (url === '') {
      return null;
    }
    return (
      <FlexContainer className={'justify-content-space-between'}>
        <div />
        <a href={url} target={'__blank'}>
          <Typography.Text type="secondary">{url}</Typography.Text>
        </a>
      </FlexContainer>
    )
  }

  const getCreatingAuthorPopup = () => {
    if (isCreatingAuthor !== true) {
      return null;
    }
    return (
      <CompanyAuthorPopup
        isShowing={true}
        companyAuthor={null}
        onSaved={(newCompanyAuthor) => {
          setCount(MathHelper.add(count, 1));
          authorSelected(newCompanyAuthor.id || '');
        }}
        onCancel={() => setIsCreatingAuthor(false)}
      />
    )
  }

  return (
    <ArticleAuthorSelectorDiv>
      <Spin spinning={isLoading}>
        <Select
          // labelInValue
          showSearch
          value={article.authorId}
          style={{ width: '100%' }}
          onChange={authorSelected}
          filterOption={(input: string, option: any) => { // eslint-disable-line
            if (!option) {
              return false;
            }
            if (!authorsMap[option.key]) {
              return false;
            }
            const author = authorsMap[option.key];
            const name = `${author.name || ''}${author.url || ''}`.toLowerCase();
            return name.indexOf(input.toLowerCase()) >= 0;
          }}
          options={
            [
              ...(Object.values(authorsMap).map((author) => ({
                label: (
                  <div>
                    <div><b>{author.name}</b></div>
                    <div>{author.url}</div>
                  </div>
                ),
                value: author.id,
                key: author.id,
                data: author,
              }))),
              ...(showCreate === true ? [{
                label: <div><div><b><FormattedMessage id="createAuthor" /></b></div><small className={'text-muted'}><FormattedMessage id="createAuthorMsg" /></small></div>,
                value: createId,
                key: createId,
                data: null,
              }] : [])
            ]
          }
        />
        {getSelectedAuthorLink()}
        {getCreatingAuthorPopup()}
      </Spin>
    </ArticleAuthorSelectorDiv>
  );
}

export default ArticleEditorAuthorSelector
