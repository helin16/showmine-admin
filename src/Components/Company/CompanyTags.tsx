import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import ICompany, {initialCompany} from '../../Types/Company/ICompany';
import ITag, {initialTag} from '../../Types/Tag/ITag';
import CompanyService from '../../Services/CompanyService';
import IError from '../../Types/IError';
import Utils from '../../Services/Utils';
import IKeyboardEvent from '../../Types/IKeyboardEvent';
import translate from '../../i18n/translate';
import {InlineInputDiv, inlineInputPaddingHalf, primaryBtnBgColor} from '../../Styles/AppWrapper';
import message from '../Form/message';
import Tag from '../Form/Tag';
import Icons from '../Icons';
import InputBox from '../Form/InputBox';

const CompanyTagsDiv = styled(InlineInputDiv)`
  .company-tag-div {
    padding: ${inlineInputPaddingHalf};
    margin-bottom: 8px;
    &.new-tag{
      cursor: pointer;
    }
  }
  .new-tag-input {
    background: transparent;
    border: none;
    box-shadow: none;
    input {
      background: transparent;
    }
    &.ant-input-affix-wrapper-focused {
      box-shadow: none;
    }
  }
`;
type iState = {
  company: ICompany,
  tags: Array<ITag>,
  loading: boolean,
  loadingErr?: IError,
  showingNewTagDiv: boolean,
  newTagName: string,
}
const initialState: iState = {
  company: initialCompany,
  tags: [],
  loading: false,
  loadingErr: undefined,
  showingNewTagDiv: false,
  newTagName: '',
};
const CompanyTags = ({ company, onChange }: {company: ICompany, onChange?: Function}) => {
  const [state, setState] = useState(initialState);

  const getUniqueTags = (tags: Array<ITag>): Array<ITag> => {
    const map = Utils.convertArrayToObject(tags, 'name');
    const values = Object.keys(map).map((key: string) => map[key]);
    return values.sort((a: ITag, b:ITag) => (a.name <= b.name ? 0 : 1));
  };

  useEffect(() => {
    if (!company.id) return;

    let isCancelled = false;
    setState((s) => ({
      ...s,
      loading: true,
      loadingErr: undefined,
    }));
    CompanyService.getCompanyTags(company.id)
      .then((res) => {
        if (isCancelled === true) return;
        setState((s) => ({
          ...s,
          tags: getUniqueTags(res.data),
          loading: false,
          loadingErr: undefined,
        }));
      })
      .catch((err) => {
        if (isCancelled === true) return;
        setState((s) => ({
          ...s,
          loading: false,
          loadingErr: err.data,
        }));
      });
    return () => { // eslint-disable-line
      isCancelled = true;
    };
  }, [company.id]);

  const deleteTag = (index: number) => {
    state.tags.splice(index, 1);
    setState({
      ...state,
      tags: state.tags,
    });
    if (typeof (onChange) === 'function') {
      onChange(state.tags);
    }
  };

  const tagUpdated = () => {
    if (state.newTagName === '') {
      return;
    }
    const tagsNames = Object.keys(Utils.convertArrayToObject(state.tags, 'name'));
    if (tagsNames.indexOf(state.newTagName) >= 0) {
      message.error(`Tag (${state.newTagName}) exists!`);
      setState({
        ...state,
        showingNewTagDiv: false,
        newTagName: '',
      });
      return;
    }
    state.tags.push({
      ...initialTag,
      name: state.newTagName,
    });
    state.tags = getUniqueTags(state.tags);
    setState({
      ...state,
      showingNewTagDiv: false,
      newTagName: '',
      tags: state.tags,
    });
    if (typeof (onChange) === 'function') {
      onChange(state.tags);
    }
  };

  const showNewTagDiv = () => {
    setState({
      ...state,
      showingNewTagDiv: true,
    });
  };

  const newTagNameChanged = (e: IKeyboardEvent<HTMLInputElement>) => {
    setState({
      ...state,
      newTagName: e.target.value,
    });
  };

  return (
    <CompanyTagsDiv>
      {state.tags.map((tag: ITag, index: number) => {
        if (tag === null) return null;
        return (
          <Tag className={'company-tag-div'}
               key={tag.name}
               closable={true}
               onClose={() => deleteTag(index)}>
            {tag.name}
          </Tag>
        );
      })}
      {state.showingNewTagDiv !== true ? (
        <Tag className={'company-tag-div new-tag'} color={primaryBtnBgColor} onClick={showNewTagDiv}>
          <Icons.PlusOutlined /> {translate('new-tag')}
        </Tag>
      ) : (
        <Tag className={'company-tag-div'}>
          <InputBox
            className={'new-tag-input'}
            placeholder={translate('new-tag-name')}
            onChange={newTagNameChanged}
            onBlur={tagUpdated}
            onPressEnter={tagUpdated}
          />
        </Tag>
      )}
    </CompanyTagsDiv>
  );
};


export default CompanyTags;
