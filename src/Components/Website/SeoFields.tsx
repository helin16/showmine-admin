import React, { useState } from 'react'
import { Input } from 'antd'
import Button from '../Form/Button'
import Space from '../Form/Space'
import MediaPicker from './MediaPicker'
import { Thumbnail } from './SectionEditors'
import translate from '../../i18n/translate'
import IAsset from '../../Types/Asset/IAsset'
import { IWebsiteSeo, SEO_DESCRIPTION_MAX, SEO_TITLE_MAX } from '../../Types/Website/IWebsite'

// Search and sharing details (specs/001-website-builder, US6): title, description and sharing image, for the site
// (settings page) or one page (page editor). Empty ones fall back to the site's, then the company's.
type iSeoFields = {
  // Makes the field ids unique on the page.
  idPrefix: string
  seo: IWebsiteSeo
  onChange: (seo: IWebsiteSeo) => void
  // Problems by field: title, description, imageAssetId.
  errors?: { [field: string]: string }
  // Images by id: null for one that is no longer among the website images.
  images: { [assetId: string]: IAsset | null }
  onImagesPicked?: (assets: IAsset[]) => void
  help: string
}

const SeoFields = ({ idPrefix, seo, onChange, errors = {}, images, onImagesPicked, help }: iSeoFields) => {
  const [isPicking, setIsPicking] = useState(false)
  const error = (field: string) =>
    errors[field] ? (
      <div id={`${idPrefix}-${field}-error`} role={'alert'} className={'ant-form-item-explain-error'}>
        {errors[field]}
      </div>
    ) : null
  const textProps = (field: 'title' | 'description', max: number) => ({
    id: `${idPrefix}-${field}`,
    value: seo[field] || '',
    maxLength: max,
    showCount: true,
    status: errors[field] ? ('error' as const) : undefined,
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `${idPrefix}-help ${idPrefix}-${field}-error` : `${idPrefix}-help`,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...seo, [field]: e.target.value }),
  })
  const imageId = seo.imageAssetId || ''
  return (
    <Space orientation={'vertical'} style={{ width: '100%' }}>
      <div id={`${idPrefix}-help`}>{help}</div>
      <div>
        <label htmlFor={`${idPrefix}-title`}>{translate('website-seo-title')}</label>
        <Input {...textProps('title', SEO_TITLE_MAX)} />
        {error('title')}
      </div>
      <div>
        <label htmlFor={`${idPrefix}-description`}>{translate('website-seo-description')}</label>
        <Input.TextArea {...textProps('description', SEO_DESCRIPTION_MAX)} autoSize={{ minRows: 2 }} />
        {error('description')}
      </div>
      {/* A group named by its label, so the buttons keep their own names. */}
      <div role={'group'} aria-label={translate('website-seo-image')}>
        <div>{translate('website-seo-image')}</div>
        <Space wrap>
          {imageId ? <Thumbnail id={imageId} images={images} /> : <span>{translate('website-image-none')}</span>}
          <Button onClick={() => setIsPicking(true)}>
            {translate(imageId ? 'website-image-change' : 'website-image-choose')}
          </Button>
          {imageId ? (
            // Null, not left out: the API keeps a key that is not sent.
            <Button onClick={() => onChange({ ...seo, imageAssetId: null })}>
              {translate('website-image-remove')}
            </Button>
          ) : null}
        </Space>
        {error('imageAssetId')}
      </div>
      <MediaPicker
        open={isPicking}
        onCancel={() => setIsPicking(false)}
        onPick={(assets) => {
          onImagesPicked?.(assets)
          onChange({ ...seo, imageAssetId: `${assets[0].id}` })
          setIsPicking(false)
        }}
      />
    </Space>
  )
}

export default SeoFields
