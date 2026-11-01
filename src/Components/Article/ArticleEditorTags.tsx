import React, { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import IArticle from '../../Types/Article/IArticle'
import message from '../Form/message'
import Select from '../Form/Select'
import * as _ from 'lodash'
import ITag from '../../Types/Article/ITag'
import Spin from '../Form/Spin';
import TagService from '../../Services/TagService';
import IItemTag from '../../Types/Article/IItemTag';
import ItemTagService from '../../Services/ItemTagService';
import MathHelper from '../../Helpers/MathHelper';
import Utils from '../../Services/Utils'

type iArticleEditorTags = {
  article: IArticle
}
/**
 *
 */
const ArticleEditorTags = ({ article }: iArticleEditorTags) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tagsMap, setTagsMap] = useState<{[key: string]: ITag}>({});
  const [itemTags, setItemTags] = useState<IItemTag[]>([]);
  const [count, setCount] = useState(0);
  const intl = useIntl();
  /**
   *
   */
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
      Promise.all([
        TagService.getAll({ where: JSON.stringify({ isActive: true }), perPage: 99999 }),
        ItemTagService.getAll({ where: JSON.stringify({ isActive: true, itemId: article.id }), perPage: 99999 })
      ])
      .then((res) => {
        if (isCancelled === true) return;
        setTagsMap((res[0].data || []).reduce((map, tag) => {
          return {
            ...map,
            [tag.id || '']: tag,
          }
        }, {}));
        setItemTags(res[1].data || []);
      })
      .catch((error) => {
        if (isCancelled === true) return;
        message.error(Utils.getErrorMessage(error))
      })
      .finally(() => {
        if (isCancelled === true) return;
        setIsLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [article, count]);

  const tagsChanged = (tagIds: string[]) => {
    const existingTagIds = _.uniq(itemTags.map(itemTag => itemTag.tagId));
    const tagIdsToBeCreated = _.difference(tagIds, existingTagIds);
    const tagIdsToBeDeleted = _.difference(existingTagIds, tagIds);

    setIsSaving(true);
    Promise.all([
      ...tagIdsToBeCreated.map(tagIdToBeCreated => ItemTagService.create({itemId: article.id, tagId: tagIdToBeCreated})),
      ...itemTags.filter(itemTag => tagIdsToBeDeleted.indexOf(itemTag.tagId) >= 0).map(itemTag => ItemTagService.deactivate(itemTag.id || ''))
    ]).then(() => {
      message.success('Tags updated.')
      setCount(MathHelper.add(count, 1));
    }).catch(err => {
      message.error(Utils.getErrorMessage(err))
    }).finally(() => {
      setIsSaving(false);
    })
  };

  return (
    <Spin spinning={isLoading || isSaving} className={'article-editor-tags-wrapper'}>
      <Select mode="tags" style={{ width: '100%' }}
        allowClear
        value={ _.uniq(itemTags.map((itemTag) => itemTag.tagId))}
        placeholder={ `${intl.formatMessage({ id: 'tags' })}...` }
        onChange={tagsChanged}
        options={Object.values(tagsMap).map((tag: ITag) => {
          return {
            label: tag.name,
            value: tag.id,
            key: tag.id,
          }
        })}
      />
    </Spin>
  );
}

export default ArticleEditorTags
