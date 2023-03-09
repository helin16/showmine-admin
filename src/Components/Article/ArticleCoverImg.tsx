import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import IArticle from '../../Types/Article/IArticle';
import SkeletonImage from '../Form/SkeletonImage';
import Image from '../Form/Image';

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
`;


const ArticleCoverImg = ({ article, onClick, ...otherProps }: {article: IArticle, style?: object, onClick?: Function}) => {
  const [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    let imageUrl = '';
    if (article && article.images && article.images.length > 0) {
      imageUrl = article.images[0].url;
    }
    setImageSrc(imageUrl);
  }, [article]);

  const clicked = () => {
    if (typeof (onClick) === 'function') {
      onClick(article);
    }
  };

  return (
    <ImageWrapper {...otherProps}>
      {imageSrc === '' ? (
        <div className={'default-img-div'}>
          <SkeletonImage className={'default-img'}/>
        </div>
      ) : (
        <Image src={imageSrc} className={'cover-img-div'} onClick={clicked} placeholder={<SkeletonImage />} />
      )}
    </ImageWrapper>
  );
};

export default ArticleCoverImg;
