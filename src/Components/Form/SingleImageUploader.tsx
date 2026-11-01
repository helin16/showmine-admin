import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useIntl } from 'react-intl'
import IError from '../../Types/IError'
import IAsset, {initAsset} from '../../Types/Asset/IAsset'
import AssetService from '../../Services/AssetService'
import { inlineInputBgColor } from '../../Styles/AppWrapper'
import Icons from '../Icons'
import Button from './Button'
import UploadDragger from './UploadDragger'
import Spin from './Spin'
import message from './message'
import Progress from './Progress'
import AppService from '../../Services/AppService';

const UploadWrapper = styled.div`
  height: 100%;
  width: 100%;
  .ant-spin {
    height: 100%;
    width: 100%;
    display: table;
    background: rgba(0, 0, 0);
    color: white;

    .ant-progress-text {
      color: white;
    }

    .ant-spin-container {
      height: 100%;
      width: 100%;
      display: table-row;
      > span {
        height: 100%;
        width: 100%;
        display: table-cell;
      }
    }

    &.ant-spin-spinning {
      .percentage-wrapper {
        top: 0px;
        bottom: 0px;
        left: 0px;
        right: 0px;
        margin: 0px;
        width: 100%;
        height: 100%;
        display: table;

        .ant-progress {
          position: relative;
          height: 100%;
          width: 100%;
          display: table-cell;
          vertical-align: middle;
        }
      }
    }
  }
`
const ImageWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: table;
  text-align: center;
  position: relative;
  background: ${inlineInputBgColor};

  .img {
    width: 100%;
    height: 100%;
    min-height: 180px;
    min-width: 180px;
    background-size: contain;
    background-position: center center;
    background-color: transparent;
    background-repeat: no-repeat;
    display: block;
  }
  .btns-overlay {
    display: none;
    position: absolute;
    top: 0px;
    bottom: 0px;
    left: 0px;
    right: 0px;
    background: rgba(0, 0, 0, 0.45);
    .btns-wrapper {
      width: 100%;
      height: 100%;
      position: relative;
      .btns {
        margin: 0;
        position: absolute;
        top: 50%;
        left: 50%;
        -ms-transform: translate(-50%, -50%);
        transform: translate(-50%, -50%);
        color: white;
      }
    }
  }
  &:hover {
    .btns-overlay {
      display: block;
    }
  }
`
type iState = {
  loading: boolean
  loadingPercentage: number
  loadingErr?: IError
  imgAsset?: IAsset
}

const initialState: iState = {
  loading: false,
  loadingPercentage: 0,
}
/**
 *
 * @param props
 */
type iSingleImageUploader = {
  initImgUrl?: string
  assetType?: string
  title?: any
  hint?: any
  onChange?: (newAsset: IAsset | null) => void;
  onSetIsSaving?: (saving: boolean) => void
  icon?: any
}
const SingleImageUploader = ({ initImgUrl, title, assetType, onChange, icon, hint, onSetIsSaving, ...otherProps }: iSingleImageUploader) => {
  const [state, setState] = useState(initialState);
  const intl = useIntl();

  /**
   *
   */
  useEffect(() => {
    setState({
      ...initialState,
      imgAsset: {
        ...initAsset,
        url: initImgUrl || '',
      },
    });
  }, [initImgUrl]);

  const upload = ({ file }: any) => { // eslint-disable-line
    if (file && file.status) {
      if (file.status.toLowerCase() === 'uploading') {
        if (onSetIsSaving) {
          onSetIsSaving(true);
        }
        setState({
          ...state,
          loading: true,
          loadingPercentage: file.percent,
        });
      } else if (file.status.toLowerCase() === 'done') {
        setState({
          ...state,
          loading: initialState.loading,
          loadingPercentage: initialState.loadingPercentage,
          imgAsset: file.response || initAsset,
        });
        if (typeof (onChange) === 'function') {
          onChange(file.response);
        }
      } else if (file.status.toLowerCase() === 'error') {
        if (onSetIsSaving) {
          onSetIsSaving(false);
        }
        setState({
          ...state,
          loading: initialState.loading,
          loadingPercentage: initialState.loadingPercentage,
        });
        message.error(AppService.getUploadFailure(file.error?.status, file.response) || intl.formatMessage({ id: 'upload-error' }));
      }
    }
  };

  const handleDelete = () => {
    setState({
      ...state,
      imgAsset: initAsset,
    });
    if (typeof (onChange) === 'function') {
      onChange(null);
    }
  };

  const getContent = () => {
    if (state.imgAsset && state.imgAsset?.url) {
      return (
        <ImageWrapper>
          <div className={'img'} style={{ backgroundImage: `url(${state.imgAsset?.url})` }}>{' '}</div>
          <div className={'btns-overlay'}>
            <div className={'btns-wrapper'}>
              <div className={'btns'}>
                <Button danger type="primary" onClick={handleDelete}>
                  <Icons.DeleteOutlined />
                </Button>
              </div>
            </div>
          </div>
        </ImageWrapper>
      );
    }
    const authHeaderObj = AppService.getHeaders();
    if (authHeaderObj === null) {
      message.error(intl.formatMessage({ id: 'not-authorize' }));
      return null;
    }
    return (
      <Spin spinning={state.loading === true}
        indicator={
          <div className={'percentage-wrapper'}>
            <Progress percent={state.loadingPercentage} type={'circle'} size={80}/>
          </div>
        }>
        <UploadDragger
          listType="picture"
          name={'file'}
          className={'image-uploader'}
          showUploadList={false}
          onChange={upload}
          accept={'image/*'}
          action={AssetService.getUploadAssetUrl()}
          headers={authHeaderObj.headers}
          data={`${assetType || ''}`.trim() === '' ? {} : {type: assetType}}
        >
          <div>
            <p className="ant-upload-drag-icon">
              {icon || <Icons.UploadOutlined />}
            </p>
            <p className="ant-upload-text">
              {title || intl.formatMessage({ id: 'upload-area' })}
            </p>
            {hint ? (
              <p className="ant-upload-hint">{hint}</p>
            ) : null}
          </div>
        </UploadDragger>
      </Spin>
    );
  };
  /**
   *
   */
  return (
    <UploadWrapper {...otherProps} className={'image-uploader-wrapper'}>
      {getContent()}
    </UploadWrapper>
  );
}

export default SingleImageUploader
