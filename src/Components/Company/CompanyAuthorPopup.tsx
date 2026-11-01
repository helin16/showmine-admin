import Icons from '../Icons';
import {BoxTitleDiv, FormInputWrapper} from '../../Styles/AppWrapper';
import InputBox from '../Form/InputBox';
import React, {ChangeEvent, useEffect, useState} from 'react';
import Modal from '../Form/Modal';
import AuthorService from '../../Services/AuthorService';
import message from '../Form/message';
import ICompanyAuthor from '../../Types/Company/ICompanyAuthor';
import {useIntl} from 'react-intl';
import Utils from '../../Services/Utils';

type iCompanyAuthorPopup = {
  isShowing: boolean;
  companyAuthor?: ICompanyAuthor | null;
  onSaved: (newCompanyAuthor: ICompanyAuthor) => void;
  onCancel: () => void;
  onPreSave?: (isSaving: boolean) => void;
  onPostSave?: (isSaving: boolean) => void;
}
const CompanyAuthorPopup = ({isShowing, onSaved, onPreSave, onPostSave, companyAuthor, onCancel}: iCompanyAuthorPopup) => {
  const [isSaving, setIsSaving] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<ICompanyAuthor | null | undefined>(undefined);
  const [errorMap, setErrorMap] = useState<{[key: string]: string}>({});
  const intl = useIntl();


  useEffect(() => {
    setEditingAuthor(companyAuthor);
  }, [companyAuthor]);


  const preSubmitCheck = () => {
    const errors: {[key: string]: string} = {};

    const name = `${editingAuthor?.name || ''}`.trim();
    if (name === '') {
      errors.name = intl.formatMessage({id: 'fieldIsRequired'}, {'fieldName': intl.formatMessage({id: 'author-name'})});
    }

    const url = `${editingAuthor?.url || ''}`.trim();
    if (url !== '' && Utils.validateUrl(url) !== true) {
      errors.url = intl.formatMessage({id: 'invalidUrl'}, {'fieldName': intl.formatMessage({id: 'link'})});
    }

    setErrorMap(errors);
    return Object.keys(errors).length === 0;
  }

  const saveAuthor = () => {
    if (preSubmitCheck() !== true) {
      message.error(intl.formatMessage({id: 'ErrorOccurred'}));
      return;
    }

    setIsSaving(true);
    if (onPreSave) {
      onPreSave(true);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const fnc = `${editingAuthor?.id || ''}`.trim() === '' ? AuthorService.create(editingAuthor) : AuthorService.update(editingAuthor.id, editingAuthor)
    fnc.then(resp => {
        message.success(intl.formatMessage({id: 'companyAuthorSaved', }, { authorName: resp.name || '' }));
        onSaved(resp);
      }).catch(err => {
        message.error(Utils.getErrorMessage(err));
      }).finally(() => {
        setIsSaving(false);
        if (onPostSave) {
          onPostSave(false);
        }
      })
  };

  if (editingAuthor === undefined) {
    return null;
  }

  return (
    <Modal
      open={isShowing}
      title={`${editingAuthor?.id || ''}`.trim() === '' ? intl.formatMessage({id: 'createCompanyAuthor'}) : intl.formatMessage({id: 'updateCompanyAuthor'})}
      onOk={() => saveAuthor()}
      okText={intl.formatMessage({id: 'save'})}
      okButtonProps={{ icon: <Icons.DeleteOutlined />, loading: isSaving === true }}
      onCancel={() => {
        onCancel()
      }}
      cancelButtonProps={{ type: 'text' }}
    >
      <FormInputWrapper>
        <BoxTitleDiv>{intl.formatMessage({id: 'author-name'})}<span className={'text-danger'}>*</span> </BoxTitleDiv>
        <InputBox
          allowClear
          placeholder={intl.formatMessage({id: 'author-name'})}
          prefix={<Icons.UserOutlined />}
          value={editingAuthor?.name || ''}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          onChange={ (e: ChangeEvent<HTMLInputElement>) => setEditingAuthor({...(editingAuthor || {}), name: e.target.value})}
        />
        {'name' in errorMap ? <div className={'text-danger'}><b>{errorMap.name}</b></div> : null}
      </FormInputWrapper>
      <FormInputWrapper>
        <BoxTitleDiv>{intl.formatMessage({id: 'link'})}</BoxTitleDiv>
        <InputBox
          allowClear
          placeholder={intl.formatMessage({id: 'url'})}
          value={editingAuthor?.url || ''}
          prefix={<Icons.LinkOutlined />}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          onChange={ (e: ChangeEvent<HTMLInputElement>) => setEditingAuthor({...(editingAuthor || {}), url: e.target.value})}
        />
        {'url' in errorMap ? <div className={'text-danger'}><b>{errorMap.url}</b></div> : null}
      </FormInputWrapper>
    </Modal>
  )
}

export default CompanyAuthorPopup
