import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import ICompany from '../../Types/Company/ICompany'
import ITag from '../../Types/Article/ITag'
import CompanyService from '../../Services/CompanyService'
import IKeyboardEvent from '../../Types/IKeyboardEvent'
import translate from '../../i18n/translate'
import { InlineInputDiv, inlineInputPaddingHalf, primaryBtnBgColor } from '../../Styles/AppWrapper'
import message from '../Form/message'
import Tag from '../Form/Tag'
import Icons from '../Icons'
import InputBox from '../Form/InputBox'
import Button from '../Form/Button'
import Spin from '../Form/Spin'
import * as _ from 'lodash'
import Utils from '../../Services/Utils'
import MathHelper from '../../Helpers/MathHelper'
import TagService from '../../Services/TagService';

const CompanyTagsDiv = styled(InlineInputDiv)`
  .company-tag-div {
    padding: ${inlineInputPaddingHalf};
    margin-bottom: 8px;
    &.new-tag {
      cursor: pointer;
    }

    &.input-tag {
      padding: 0px;

      .ant-input-group-addon {
        padding: 0px;
      }
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
`

type iTagsMap = { [key: string]: ITag }
const CompanyTags = () => {
  const [showingNewTagDiv, setShowingNewTagDiv] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tagsMap, setTagsMap] = useState<iTagsMap>({});
  const [newTagName, setNewTagName] = useState('');
  const [count, setCount] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    TagService.getAll({
      where: JSON.stringify({ isActive: true }), perPage: 99999
    })
      .then((res) => {
        if (isCancelled === true) return;
        setTagsMap(res.data.reduce((map: iTagsMap, tag:ITag) => {
          return {
            ...map,
            [tag.id || '']: tag,
          }
        }, {}));
        setNewTagName('');
        setShowingNewTagDiv(false);
      })
      .catch((err) => {
        if (isCancelled === true) return;
        message.error(err.response.data.message);
      })
      .finally(() => {
        if (isCancelled === true) return;
        setIsLoading(false);
      });

    return () => { // eslint-disable-line
      isCancelled = true;
    };
  }, [count]);

  const deleteTag = (tag: ITag) => {
    const tagId = `${tag.id || ''}`.trim();
    if (tagId === '') {
      return;
    }
    setIsSaving(true);
    TagService.deactivate(tagId)
      .then(res => {
        message.success(`Tag (=${res.name}) deleted!`);
      })
      .catch(err => {
        message.error(err.response.data.message);
      })
      .finally(() => {
        setIsSaving(false);
        setCount(MathHelper.add(count, 1))
      })
  };

  const newTagNameChanged = (e: IKeyboardEvent<HTMLInputElement>) => {
    setNewTagName(e.target.value);
  };

  const createTag = () => {
    const newTagNameTrim = `${newTagName || ''}`.trim();
    if (newTagNameTrim === '') {
      message.error('Tag can NOT be empty');
      return;
    }
    const matchedTag = _.find(Object.values(tagsMap), {name: newTagNameTrim});
    if (matchedTag !== undefined) {
      message.error(`Tag (=${newTagNameTrim}) already exists!`);
      return;
    }
    setIsSaving(true);
    TagService.create({name: newTagNameTrim})
      .then(res => {
        message.success(`Tag (=${res.name}) created!`);
      })
      .catch(err => {
        message.error(err.response.data.message);
      })
      .finally(() => {
        setIsSaving(false);
        setCount(MathHelper.add(count, 1))
      })
  }

  const getNewTagDiv = () => {
    if (showingNewTagDiv === true) {
      return (
        <Tag className={'company-tag-div input-tag'}>
         <InputBox
           className={'new-tag-input'}
           placeholder={translate('new-tag-name')}
           onChange={newTagNameChanged}
           onPressEnter={createTag}
           addonAfter={
             <Button size={'small'} type={'text'} onClick={() => setShowingNewTagDiv(false)}><Icons.CloseOutlined /></Button>
           }
         />
       </Tag>
     )
   }
   return (
     <Tag className={'company-tag-div new-tag'} color={primaryBtnBgColor} onClick={() => setShowingNewTagDiv(true)}>
       <Icons.PlusOutlined /> {translate('new-tag')}
     </Tag>
   )
 }

 return (
   <CompanyTagsDiv>
     <Spin spinning={isLoading || isSaving}>
       {Object.values(tagsMap).map((tag: ITag) => {
         if (tag === null) return null;
         return (
           <Tag
             className={'company-tag-div'}
             key={tag.id}
             closable={true}
             onClose={() => deleteTag(tag)}>
             {tag.name}
           </Tag>
         );
       })}
       {getNewTagDiv()}
     </Spin>
   </CompanyTagsDiv>
 );
}

export default CompanyTags
