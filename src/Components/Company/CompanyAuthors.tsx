import React, { ChangeEvent, useEffect, useState } from 'react'
import styled from 'styled-components'
import translate from '../../i18n/translate'
import {
  BoxTitleDiv,
  FormInputWrapper,
  InlineInputDiv,
  inlineInputPaddingHalf,
  primaryBtnBgColor,
} from '../../Styles/AppWrapper'
import InputBox from '../Form/InputBox'
import Icons from '../Icons'
import Tag from '../Form/Tag'
import AuthorService from '../../Services/AuthorService'
import message from '../Form/message'
import IAuthor from '../../Types/Article/IAuthor';
import MathHelper from '../../Helpers/MathHelper';
import Modal from '../Form/Modal';
import Spin from '../Form/Spin';

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
  const [editingAuthor, setEditingAuthor] = useState<IAuthor | null | {name: string; url?: string}>(null);

  useEffect(() => {
    setIsLoading(true);
    AuthorService.getAll({
        where: JSON.stringify({ isActive: true }), perPage: 99999
      }).then(resp => {
        setAuthorsMap(
          (resp.data || []).reduce((map, author) => ({...map, [author.id || '']: author}), {}),
        );
        setEditingAuthor(null);
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
      .then(resp => {
        message.success(`Author(${author.name}) deleted.`)
      }).catch(err => {
        message.error(err.response.data.message);
      }).finally(() => {
        setIsSaving(false);
        setCount(MathHelper.add(count, 1));
      })
  };

  const changeAuthor = (author: IAuthor, data: {[key: string]: string}) => {
    const authorId = `${author.id || ''}`.trim();
    if (authorId === '') {
      return;
    }
    setIsSaving(true);
    AuthorService.update(authorId, data)
      .then(resp => {
        message.success(`Author(${author.name}) updated.`)
      }).catch(err => {
      message.error(err.response.data.message);
    }).finally(() => {
      setIsSaving(false);
      setCount(MathHelper.add(count, 1));
    })
  };

  const saveAuthor = () => {
    if (editingAuthor === null) { return }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const authorId = `${editingAuthor?.id || ''}`.trim();
    if (editingAuthor !== null && authorId !== '') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return changeAuthor(editingAuthor, editingAuthor);
    }
    setIsSaving(true);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    AuthorService.create(editingAuthor)
      .then(resp => {
        message.success(`Author(${resp.name}) created.`)
      }).catch(err => {
      message.error(err.response.data.message);
    }).finally(() => {
      setIsSaving(false);
      setCount(MathHelper.add(count, 1));
    })
  };


  const getAuthorPopoverDiv = () => {
    if (editingAuthor === null) {
      return null;
    }
    return (
      <Modal
        open={true}
        title={'Save Author'}
        onOk={() => saveAuthor()}
        okText={'save'}
        okButtonProps={{ icon: <Icons.DeleteOutlined />, loading: isSaving === true }}
        onCancel={() => {
          setEditingAuthor(null)
        }}
        cancelButtonProps={{ type: 'text' }}
      >
        <FormInputWrapper>
          <BoxTitleDiv>{translate('name')}</BoxTitleDiv>
          <InputBox
            allowClear
            placeholder={translate('author-name')}
            prefix={<Icons.UserOutlined />}
            value={editingAuthor?.name || ''}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            onChange={ (e: ChangeEvent<HTMLInputElement>) => setEditingAuthor({...(editingAuthor || {}), name: e.target.value})}
          />
        </FormInputWrapper>
        <FormInputWrapper>
          <BoxTitleDiv>{translate('link')}</BoxTitleDiv>
          <InputBox
            allowClear
            placeholder={translate('url')}
            value={editingAuthor?.url || ''}
            prefix={<Icons.LinkOutlined />}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            onChange={ (e: ChangeEvent<HTMLInputElement>) => setEditingAuthor({...(editingAuthor || {}), url: e.target.value})}
          />
        </FormInputWrapper>
      </Modal>
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
              className={'author-tag-div'}
              closable={true}
              onClick={() => setEditingAuthor(author)}
              onClose={() => deleteAuthor(author)}>
              {author.name}
            </Tag>
          );
        })}
        <Tag className={'author-tag-div new-author'} color={primaryBtnBgColor} onClick={() => setEditingAuthor({name: '', url: ''})}>
          <Icons.PlusOutlined /> {translate('new-author')}
        </Tag>
      </Spin>
      {getAuthorPopoverDiv()}
    </AuthorsWrapper>
  );
}

export default CompanyAuthors
