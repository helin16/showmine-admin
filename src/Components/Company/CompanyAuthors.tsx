import React, { ChangeEvent, useEffect, useState } from 'react';
import styled from 'styled-components';
import ICompanyAuthor, {initialCompanyAuthor} from '../../Types/Company/ICompanyAuthor';
import IKeyboardEvent from '../../Types/IKeyboardEvent';
import translate from '../../i18n/translate';
import {
  BoxTitleDiv,
  FormInputWrapper,
  InlineInputDiv,
  inlineInputPaddingHalf,
  primaryBtnBgColor
} from '../../Styles/AppWrapper';
import InputBox from '../Form/InputBox';
import Icons from '../Icons';
import Tag from '../Form/Tag';
import Popover from '../Form/Popover';

type iState = {
  authors: ICompanyAuthor[],
  editingAuthor?: any, // eslint-disable-line
}
const initState: iState = {
  authors: [],
};
const AuthorsWrapper = styled(InlineInputDiv)`
  .author-tag-div {
    padding: ${inlineInputPaddingHalf};
    margin-bottom: 8px;
    &.new-author{
      cursor: pointer;
    }
  }
`;
/**
 *
 * @param authors
 * @param onDelete
 */
const CompanyAuthors =  ({ authors, onChange }: {authors: ICompanyAuthor[], onChange?: Function}) => {
  const [state, setState] = useState(initState);

  useEffect(() => {
    if (!authors || authors.length === 0) return;
    setState((s) => ({
      ...s,
      authors: authors.filter((author) => author !== null),
    }));
  }, [authors]);

  const deleteAuthor = (index: number) => {
    state.authors.splice(index, 1).filter((author) => author !== null);
    setState({
      ...state,
      authors: state.authors,
    });
    if (typeof (onChange) === 'function') {
      onChange(state.authors);
    }
  };

  const changeAuthor = (index: number, fieldName: string, newValue: string) => {
    const newAuthor = {
      ...state.authors[index],
      [fieldName]: newValue,
    };
    if (newAuthor.author === '' && newAuthor.authorLink === '') {
      deleteAuthor(index);
    } else {
      state.authors[index] = newAuthor;
      setState({
        ...state,
        authors: state.authors,
      });
    }
  };

  const saveAuthor = (index: number, fieldName: string, newValue: string) => {
    const newAuthor = {
      ...state.authors[index],
      [fieldName]: newValue,
    };
    if (newAuthor.author === '' && newAuthor.authorLink === '') {
      deleteAuthor(index);
    } else {
      state.authors[index] = newAuthor;
      state.authors = state.authors.filter((author) => author !== null);
      setState({
        ...state,
        authors: state.authors,
      });
      if (typeof (onChange) === 'function'
        && state.editingAuthor !== undefined
        && state.editingAuthor[fieldName] !== newValue) {
        onChange(state.authors);
      }
    }
    selectedAnAuthor();
  };

  const selectedAnAuthor = (author?: ICompanyAuthor) => {
    setState({
      ...state,
      editingAuthor: author,
    });
  };

  const newAuthor = () => {
    state.authors.push({
      ...initialCompanyAuthor,
      author: translate('new-author'),
    });
    setState({
      ...state,
      authors: state.authors,
    });
    if (typeof (onChange) === 'function') {
      onChange(state.authors);
    }
  };

  const getAuthorPopoverDiv = (author: ICompanyAuthor, index: number) => (
      <div>
        <FormInputWrapper>
          <BoxTitleDiv>{translate('name')}</BoxTitleDiv>
          <InputBox
            allowClear
            placeholder={translate('author-name')}
            prefix={<Icons.UserOutlined />}
            value={author.author}
            onClick={() => selectedAnAuthor(author)}
            onChange={ (e: ChangeEvent<HTMLInputElement>) => changeAuthor(index, 'author', e.target.value)}
            onPressEnter={(e: IKeyboardEvent<HTMLInputElement>) => saveAuthor(index, 'author', e.target.value)}
            onBlur={(e: ChangeEvent<HTMLInputElement>) => saveAuthor(index, 'author', e.target.value)}
          />
        </FormInputWrapper>
        <FormInputWrapper>
          <BoxTitleDiv>{translate('link')}</BoxTitleDiv>
          <InputBox
            allowClear
            placeholder={translate('url')}
            value={author.authorLink}
            prefix={<Icons.LinkOutlined />}
            onClick={() => selectedAnAuthor(author)}
            onChange={ (e: ChangeEvent<HTMLInputElement>) => changeAuthor(index, 'authorLink', e.target.value)}
            onPressEnter={(e: IKeyboardEvent<HTMLInputElement>) => saveAuthor(index, 'authorLink', e.target.value)}
            onBlur={(e: ChangeEvent<HTMLInputElement>) => saveAuthor(index, 'authorLink', e.target.value)}
          />
        </FormInputWrapper>
      </div>
  );
  /**
   * Render
   */
  return (
    <AuthorsWrapper>
      {state.authors.map((author: ICompanyAuthor, index: number) => {
        if (author === null) return null;
        return (
          <Popover key={index} placement="topLeft" content={getAuthorPopoverDiv(author, index)}>
            <Tag className={'author-tag-div'}
                 closable={true}
                 onClose={() => deleteAuthor(index)}>
              {author.author}
            </Tag>
          </Popover>
        );
      })}
      <Tag className={'author-tag-div new-author'} color={primaryBtnBgColor} onClick={newAuthor}>
        <Icons.PlusOutlined /> {translate('new-author')}
      </Tag>
    </AuthorsWrapper>
  );
};


export default CompanyAuthors;
