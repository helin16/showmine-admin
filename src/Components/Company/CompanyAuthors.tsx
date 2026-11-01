import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import translate from '../../i18n/translate'
import {
  InlineInputDiv,
  inlineInputPaddingHalf,
  primaryBtnBgColor,
} from '../../Styles/AppWrapper'
import Icons from '../Icons'
import Tag from '../Form/Tag'
import AuthorService from '../../Services/AuthorService'
import message from '../Form/message'
import IAuthor from '../../Types/Article/IAuthor';
import MathHelper from '../../Helpers/MathHelper';
import Spin from '../Form/Spin';
import CompanyAuthorPopup from './CompanyAuthorPopup';
import {useIntl} from 'react-intl';
import Utils from '../../Services/Utils'

const AuthorsWrapper = styled(InlineInputDiv)`
  .author-tag-div {
    padding: ${inlineInputPaddingHalf};
    margin-bottom: 8px;
    &.new-author {
      cursor: pointer;
    }
  }
`
/**
 *
 * @param authors
 * @param onDelete
 */
const CompanyAuthors = () => {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [authorsMap, setAuthorsMap] = useState<{ [key: string]: IAuthor }>({});
  const [editingAuthor, setEditingAuthor] = useState<IAuthor | null | undefined>(undefined);
  const intl = useIntl();

  useEffect(() => {
    setIsLoading(true);
    AuthorService.getAll({
        where: JSON.stringify({ isActive: true }), perPage: 99999
      }).then(resp => {
        setAuthorsMap(
          (resp.data || []).reduce((map, author) => ({...map, [author.id || '']: author}), {}),
        );
        setEditingAuthor(undefined);
      }).catch(err => {
          message.error(`${err.message}`);
      }).finally(() => {
        setIsLoading(false);
      })
  }, [count]);

  const deleteAuthor = (author: IAuthor) => {
    const authorId = `${author.id || ''}`.trim();
    if (authorId === '') {
      return;
    }
    setIsSaving(true);
    AuthorService.deactivate(authorId)
      .then(() => {
        message.success(intl.formatMessage({id: 'companyAuthorDeleted'}))
      }).catch(err => {
        message.error(Utils.getErrorMessage(err));
      }).finally(() => {
        setIsSaving(false);
        setCount(MathHelper.add(count, 1));
      })
  };

  const getAuthorPopoverDiv = () => {
    return (
      <CompanyAuthorPopup
        isShowing={true}
        companyAuthor={editingAuthor}
        onSaved={() => {
          setCount(MathHelper.add(count, 1));
        }}
        onCancel={() => {
          setEditingAuthor(undefined)
        }}
      />
    )
  };

  /**
   * Render
   */
  return (
    <AuthorsWrapper>
      <Spin spinning={isLoading || isSaving}>
        {Object.values(authorsMap).map((author: IAuthor) => {
          if (author === null) return null;
          return (
            <Tag
              key={author.id}
              closable={true}
              className={'author-tag-div'}
              onClick={() => setEditingAuthor(author)}
              onClose={() => deleteAuthor(author)}>
              {author.name}
            </Tag>
          );
        })}
        <Tag className={'author-tag-div new-author'} color={primaryBtnBgColor} onClick={() => setEditingAuthor(null)}>
          <Icons.PlusOutlined /> {translate('new-author')}
        </Tag>
      </Spin>
      {getAuthorPopoverDiv()}
    </AuthorsWrapper>
  );
}

export default CompanyAuthors
