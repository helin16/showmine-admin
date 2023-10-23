import React, { useEffect, useState } from 'react'
import moment from 'moment'
import styled from 'styled-components'
import AssetService from '../../Services/AssetService'
import LoadMoreBtn from '../Form/LoadMoreBtn'
import message from '../Form/message'
import List, { ListItem, ListItemMeta } from '../Form/List'
import PopConfirm from '../Form/Popconfirm'
import Icons from '../Icons'
import Button from '../Form/Button'
import Image from '../Form/Image'
import IResList from '../../Types/IResList'
import IAsset from '../../Types/Asset/IAsset'
import MathHelper from '../../Helpers/MathHelper';
import {APP_WIDTHS} from '../../Constants';

export const MediaListWrapper = styled.div`
  .media-list-item {
    cursor: pointer;
    img {
      objectfit: contain;
      width: 150px;
      height: 100px;
    }

    .article-title-link {
      padding: 0px;
      max-width: 50%;
      > span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
      }
    }

    @media only screen and (max-width: ${APP_WIDTHS.xs}) {
      .extra-meta {
        display: none;
      }
    }
  }
`

type iMediaList = {
  keyword?: string
}
const MediaList = ({ keyword }: iMediaList) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pageNo, setPageNo] = useState(1);
  const [assetList, setAssetList] = useState<IResList<IAsset> | null>(null);
  /**
   * when keyword changed
   */
  useEffect(() => {
    let isCanceled = false;
    setIsLoading(true);
    AssetService.getAll({
      where: JSON.stringify({
        isActive: true
      }),
      sort: 'createdAt:DESC',
      currentPage: pageNo,
    }).then(res => {
      if (isCanceled) return;
      setAssetList({
        ...res,
        data: pageNo === 1 ? res.data : [...(assetList?.data || []), ...res.data]
      });
    }).catch(err => {
      if (isCanceled) return;
      message.error(err.response.data.message);
    }).finally(() => {
      setIsLoading(false);
    })
    return () => {
      isCanceled = true;
    }
  }, [keyword, pageNo]);

  /**
   *
   */
  const confirmDelete = (asset: IAsset, index: number) => {
    const assetId = `${asset.id || ''}`.trim();
    if (assetId === '') { return }
    setIsSaving(true);
    AssetService.deactivate(assetId)
      .then(() => {
        (assetList?.data || []).splice(index, 1);
      })
      .catch((err) => {
        message.error(`Failed to delete selected media: ${err.response.data.message}`);
      })
      .finally(() => {
        setIsSaving(false);
      })
  };

  /**
   * load more results
   */
  const loadMore = () => {
    setPageNo(MathHelper.add(pageNo , 1));
  };

  return (
    <MediaListWrapper>
      <List
        className="media-list"
        loading={(isLoading && pageNo === 1) || isSaving}
        loadMore={
          <LoadMoreBtn onClick={()  => loadMore()}
             loading={isLoading && pageNo > 1 }
             showing={(assetList?.currentPage || 0) < (assetList?.pages || 0)}
          />
        }
        itemLayout={'horizontal'}
        dataSource={assetList?.data || []}
        renderItem={(asset: IAsset, index: number) => {
          const fileSize = AssetService.formatFileSize(asset.fileSize || 0).join(' ');
          return (
            <ListItem
              className={'media-list-item'}
              key={asset.id}
              actions={[
                <PopConfirm
                  key={'delete-btn'}
                  title="Are you sure delete this?"
                  onConfirm={() => { confirmDelete(asset, index); }}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button danger type="text">
                    <Icons.DeleteOutlined />
                    delete
                  </Button>
                </PopConfirm>,
              ]}
            >
              <ListItemMeta
                avatar={
                  <Image
                    src={asset.url || ''}
                    className={'img-wrapper'}
                    alt={asset.comments || ''}
                    fallback="data:image/png;base64,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"
                  />
                }
                description={
                  <div className={'description'}>
                    <div>type: {asset.type}</div>
                    <div>size: {fileSize}</div>
                  </div>
                }
              />
              <div className={'extra-meta'}>
                {moment(asset.createdAt).format('lll')}
                <div>{asset.comments || ''}</div>
              </div>
            </ListItem>
          );
        }}
      />
    </MediaListWrapper>
  );
}

export default MediaList
