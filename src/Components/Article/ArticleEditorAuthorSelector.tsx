import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import IArticle, {initialArticle} from '../../Types/Article/IArticle';
import ICompany from '../../Types/Company/ICompany';
import Utils from '../../Services/Utils';
import ArticleService from '../../Services/ArticleService';
import Select from '../Form/Select';
import Typography from '../Form/Typography';
import message from '../Form/message';

type iState = {
  article: IArticle,
  authors: any, // eslint-disable-line
  selectedAuthor: { author: string, authorLink: string },
}
const initState: iState = {
  article: initialArticle,
  authors: {},
  selectedAuthor: { author: '', authorLink: '' },
};

const ArticleAuthorSelectorDiv = styled.div``;

const ArticleEditorAuthorSelector = ({ article, company, onChange } : {article: IArticle, company: ICompany, onChange?: Function}) => {
  const [state, setState] = useState(initState);

  useEffect(() => {
    if (!article) return;
    const getAuthors = (comp: ICompany): any => { // eslint-disable-line
      if (!comp.configObj) return initState.authors;
      if (!('authorInfo' in comp.configObj)) {
        return initState.authors;
      }
      return Utils.convertArrayToObject(comp.configObj.authorInfo, 'author');
    };

    const authors = getAuthors(company);
    setState((s) => ({
      ...s,
      article,
      authors,
      selectedAuthor: (article.author in authors ? authors[article.author] : initState.selectedAuthor),
    }));
  }, [article, company]);

  /**
   *
   * @param newAuthor
   */
  const authorSelected = (newAuthor: string) => {
    const newArticle = {
      ...state.article,
      author: newAuthor,
    };
    if (!state.article.id) {
      message.error('Error when update author: invalid article. Please refresh your page and try again.');
      return;
    }
    ArticleService.updateArticle(state.article.id, newArticle)
      .then((res) => {
        message.success('Author Updated.');
        setState({
          ...state,
          article: res.data,
          selectedAuthor: (newAuthor in state.authors ? state.authors[newAuthor] : state.selectedAuthor),
        });
        if (typeof (onChange) === 'function') {
          onChange(res.data);
        }
      })
      .catch((err) => {
        message.error(`Error when update author: ${err.message}`);
      });
  };

  return (
    <ArticleAuthorSelectorDiv>
      <Select
        // labelInValue
        showSearch
        value={state.selectedAuthor.author}
        style={{ width: '100%' }}
        onChange={authorSelected}
        filterOption={(input: string, option: any) => { // eslint-disable-line
          if (!option) {
            return false;
          }
          if (!state.authors[option.key]) {
            return false;
          }
          const author = state.authors[option.key];
          const name = `${author.author || ''}${author.authorLink || ''}`.toLowerCase();
          return name.indexOf(input.toLowerCase()) >= 0;
        }}
        options={
          Object.keys(state.authors).map((authorName: string) => ({
            label: (
              <div>
                <div><b>{authorName}</b></div>
                <div>{state.authors[authorName].authorLink}</div>
              </div>
            ),
            value: authorName,
            key: authorName,
          }))
        }
      />
      <div style={{ textAlign: 'right' }}>
        <a href={state.selectedAuthor.authorLink} target={'__blank'}>
          <Typography.Text type="secondary">{state.selectedAuthor.authorLink}</Typography.Text>
        </a>
      </div>
    </ArticleAuthorSelectorDiv>
  );
};


export default ArticleEditorAuthorSelector;
