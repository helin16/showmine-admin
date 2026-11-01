import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import IArticle from '../../Types/Article/IArticle'
import SkeletonImage from '../Form/SkeletonImage'

const ImageWrapper = styled.div`
  width: 100%;
  height: 100%;
  text-align: center;
  background: #f2f2f2;
  .default-img-div {
    width: 100%;
    height: 100%;
    position: relative;
    .default-img {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }
  .cover-img-div {
    width: 100%;
    height: 100%;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
`
type iArticleCoverImg = {
  article: IArticle
  imgWrapperProps?: { [key: string]: string }
  onClick?: (article: IArticle) => void;
}
const ArticleCoverImg = ({ article, onClick, imgWrapperProps}: iArticleCoverImg) => {
  const [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    setImageSrc(`${article.CoverAsset?.url || ''}`.trim());
  }, [article]);

  const clicked = () => {
    if (typeof (onClick) === 'function') {
      onClick(article);
    }
  };

  return (
    <ImageWrapper {...imgWrapperProps}>
      {imageSrc === '' ? (
        <div className={'default-img-div'}>
          <SkeletonImage className={'default-img'}/>
        </div>
      ) : (
        <div className={'cover-img-div'} onClick={clicked} style={{backgroundImage: `url(${imageSrc})`}}/>
      )}
    </ImageWrapper>
  );
}

export default ArticleCoverImg
