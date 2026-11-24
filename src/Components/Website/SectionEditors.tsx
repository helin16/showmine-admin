import React, { useState } from 'react'
import { Checkbox, Input, InputNumber } from 'antd'
import Button from '../Form/Button'
import RichTextEditor from '../Form/RichTextEditor'
import MediaPicker from './MediaPicker'
import IAsset from '../../Types/Asset/IAsset'
import Space from '../Form/Space'
import translate from '../../i18n/translate'
import { IWebsiteSection } from '../../Types/Website/IWebsite'

// One editor per section type (specs/001-website-builder, data-model "Section", US2 T035, US5 T062). Limits match the
// API's. Images are chosen from the company's website images with the media picker.

export const ADDABLE_SECTION_TYPES = ['hero', 'text', 'image', 'gallery', 'contact', 'articles']
export const MAX_GALLERY_IMAGES = 24

type iGalleryImage = { assetId: string; alt?: string }

// Every image id a page's sections use.
export const getImageIds = (sections: IWebsiteSection[]) =>
  Array.from(
    new Set(
      sections.flatMap((section) => [
        ...(typeof section.imageAssetId === 'string' ? [section.imageAssetId] : []),
        ...(typeof section.assetId === 'string' ? [section.assetId] : []),
        ...(Array.isArray(section.images) ? (section.images as iGalleryImage[]).map((image) => image.assetId) : []),
      ]),
    ),
  )

export const newSection = (type: string): IWebsiteSection => {
  const id = crypto.randomUUID()
  switch (type) {
    case 'hero':
      return { id, type, heading: '' }
    case 'text':
      return { id, type, html: '' }
    case 'contact':
      return { id, type, showPhone: true, showEmail: true, showAddress: true }
    case 'image':
      return { id, type }
    case 'gallery':
      return { id, type, images: [] }
    default:
      return { id, type: 'articles', count: 3 }
  }
}

const getProtocol = (value: string) => {
  try {
    return new URL(value).protocol
  } catch {
    return null
  }
}

// Web, email or phone links, or a page of the same site: the same rule as the API's.
export const isLink = (value: string) =>
  /^\/[a-z0-9-]{1,40}$/.test(value) || ['http:', 'https:', 'mailto:', 'tel:'].includes(`${getProtocol(value)}`)

// The text editor without image, video or embed buttons: their uploads would not be website images.
const TEXT_TOOLBAR =
  'undo redo | formatselect | bold italic forecolor | alignleft aligncenter alignright | bullist numlist | link removeformat'
const TEXT_PLUGINS = ['advlist', 'autolink', 'lists', 'link', 'paste', 'autoresize']

type iField = { label: string; error?: string; id: string; children: React.ReactNode }
const Field = ({ label, error, id, children }: iField) => (
  <div className={'website-section-field'}>
    <label htmlFor={id}>{label}</label>
    {children}
    {error ? (
      <div id={`${id}-error`} role={'alert'} className={'ant-form-item-explain-error'}>
        {error}
      </div>
    ) : null}
  </div>
)

type iSectionEditor = {
  section: IWebsiteSection
  onChange: (section: IWebsiteSection) => void
  // Problems by field name, from the API or the checks here.
  errors?: { [field: string]: string }
  // The page's images by id: null when one is no longer among the website images.
  images?: { [assetId: string]: IAsset | null }
  // Images just picked, so the page can show them.
  onImagesPicked?: (assets: IAsset[]) => void
}

// An image of a section: its thumbnail, or a note that it is missing.
const Thumbnail = ({ id, images }: { id: string; images: { [assetId: string]: IAsset | null } }) => {
  const image = images[id]
  if (image === undefined) return <span>{translate('website-image-loading')}</span>
  if (image === null) return <span className={'ant-form-item-explain-error'}>{translate('website-image-missing')}</span>
  return <img src={image.url} alt={image.fileName} style={{ maxWidth: 160, maxHeight: 100 }} />
}

const SectionEditor = ({ section, onChange, errors = {}, images = {}, onImagesPicked }: iSectionEditor) => {
  // Which image the picker is choosing: a single field, or more for the gallery.
  const [picking, setPicking] = useState<'imageAssetId' | 'assetId' | 'images'>()
  const picked = (assets: IAsset[]) => {
    onImagesPicked?.(assets)
    if (picking === 'images') {
      const old = (section.images as iGalleryImage[]) || []
      onChange({ ...section, images: [...old, ...assets.map((asset) => ({ assetId: `${asset.id}` }))] })
    } else if (picking) {
      onChange({ ...section, [picking]: `${assets[0].id}` })
    }
    setPicking(undefined)
  }
  const picker = (
    <MediaPicker
      open={picking !== undefined}
      multiple={picking === 'images'}
      max={MAX_GALLERY_IMAGES - ((section.images as iGalleryImage[]) || []).length}
      onCancel={() => setPicking(undefined)}
      onPick={picked}
    />
  )
  // A single image field: thumbnail, choose or change, and remove when it is optional.
  const imageField = (name: 'imageAssetId' | 'assetId', label: string, isOptional: boolean) => {
    const id = typeof section[name] === 'string' ? `${section[name]}` : ''
    return (
      // A group named by its label, so the buttons keep their own names.
      <div key={name} role={'group'} aria-label={label} className={'website-section-field'}>
        <div>{label}</div>
        <Space wrap>
          {id ? <Thumbnail id={id} images={images} /> : <span>{translate('website-image-none')}</span>}
          <Button onClick={() => setPicking(name)}>
            {translate(id ? 'website-image-change' : 'website-image-choose')}
          </Button>
          {id && isOptional ? (
            <Button
              onClick={() => {
                const next = { ...section }
                delete next[name]
                onChange(next)
              }}
            >
              {translate('website-image-remove')}
            </Button>
          ) : null}
        </Space>
        {errors[name] ? (
          <div role={'alert'} className={'ant-form-item-explain-error'}>
            {errors[name]}
          </div>
        ) : null}
      </div>
    )
  }
  const set = (field: string, value: unknown) => {
    const next = { ...section, [field]: value }
    // An empty optional field is left out, as the API refuses an empty link.
    if (value === '' || value === null || value === undefined) {
      delete next[field]
    }
    onChange(next)
  }
  const fieldId = (field: string) => `${section.id}-${field}`
  const text = (field: string, max: number, multiLine = false) => {
    const props = {
      id: fieldId(field),
      value: `${section[field] ?? ''}`,
      maxLength: max,
      status: errors[field] ? ('error' as const) : undefined,
      'aria-invalid': errors[field] ? true : undefined,
      'aria-describedby': errors[field] ? `${fieldId(field)}-error` : undefined,
    }
    return multiLine ? (
      <Input.TextArea {...props} autoSize={{ minRows: 2 }} onChange={(e) => set(field, e.target.value)} />
    ) : (
      <Input {...props} onChange={(e) => set(field, e.target.value)} />
    )
  }
  const field = (name: string, label: string, control: React.ReactNode) => (
    <Field key={name} id={fieldId(name)} label={label} error={errors[name]}>
      {control}
    </Field>
  )

  switch (section.type) {
    case 'hero':
      return (
        <Space orientation={'vertical'} style={{ width: '100%' }}>
          {field('heading', translate('website-section-heading'), text('heading', 120))}
          {imageField('imageAssetId', translate('website-section-hero-image'), true)}
          {picker}
          {field('subheading', translate('website-section-subheading'), text('subheading', 300, true))}
          {field('buttonText', translate('website-section-button-text'), text('buttonText', 40))}
          {field('buttonUrl', translate('website-section-button-url'), text('buttonUrl', 2000))}
        </Space>
      )
    case 'text':
      return field(
        'html',
        translate('website-section-text'),
        <RichTextEditor
          value={`${section.html ?? ''}`}
          toolbar={TEXT_TOOLBAR}
          plugins={TEXT_PLUGINS}
          ariaLabel={translate('website-section-text')}
          onLiveChange={(html) => onChange({ ...section, html })}
        />,
      )
    case 'contact':
      return (
        <Space orientation={'vertical'} style={{ width: '100%' }}>
          <div>{translate('website-section-contact-help')}</div>
          {(['showPhone', 'showEmail', 'showAddress'] as const).map((name) => (
            <Checkbox
              key={name}
              checked={section[name] === true}
              onChange={(e) => onChange({ ...section, [name]: e.target.checked })}
            >
              {translate(`website-section-${name}`)}
            </Checkbox>
          ))}
          {field('mapUrl', translate('website-section-map-url'), text('mapUrl', 2000))}
        </Space>
      )
    case 'articles':
      return (
        <Space orientation={'vertical'} style={{ width: '100%' }}>
          {field(
            'count',
            translate('website-section-article-count'),
            <InputNumber
              id={fieldId('count')}
              min={3}
              max={12}
              precision={0}
              value={Number(section.count) || 3}
              onChange={(count) => onChange({ ...section, count: count ?? 3 })}
            />,
          )}
          {field('tagName', translate('website-section-tag'), text('tagName', 50))}
        </Space>
      )
    case 'image':
      return (
        <Space orientation={'vertical'} style={{ width: '100%' }}>
          {imageField('assetId', translate('website-section-image'), false)}
          {field('alt', translate('website-section-alt'), text('alt', 200))}
          {field('caption', translate('website-section-caption'), text('caption', 300))}
          {picker}
        </Space>
      )
    case 'gallery': {
      const gallery = (section.images as iGalleryImage[]) || []
      const setGallery = (next: iGalleryImage[]) => onChange({ ...section, images: next })
      const move = (index: number, by: number) => {
        const next = [...gallery]
        const [image] = next.splice(index, 1)
        next.splice(index + by, 0, image)
        setGallery(next)
      }
      return (
        <Space orientation={'vertical'} style={{ width: '100%' }}>
          {gallery.map((image, index) => {
            const name = translate('website-gallery-image', { number: index + 1 })
            const altId = `${section.id}-images-${index}-alt`
            const altError = errors[`images[${index}].alt`] || errors[`images[${index}].assetId`]
            return (
              <Space key={index} wrap align={'start'}>
                <Thumbnail id={image.assetId} images={images} />
                <div>
                  <label htmlFor={altId}>{translate('website-gallery-alt', { number: index + 1 })}</label>
                  <Input
                    id={altId}
                    value={image.alt ?? ''}
                    maxLength={200}
                    status={altError ? 'error' : undefined}
                    onChange={(e) =>
                      setGallery(
                        gallery.map((g, i) => {
                          if (i !== index) return g
                          // An empty description is left out, as other empty fields are.
                          return e.target.value === '' ? { assetId: g.assetId } : { ...g, alt: e.target.value }
                        }),
                      )
                    }
                  />
                  {altError ? (
                    <div role={'alert'} className={'ant-form-item-explain-error'}>
                      {altError}
                    </div>
                  ) : null}
                </div>
                <Button
                  aria-label={translate('website-move-up', { name })}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </Button>
                <Button
                  aria-label={translate('website-move-down', { name })}
                  disabled={index === gallery.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </Button>
                <Button
                  aria-label={translate('website-remove-named', { name })}
                  onClick={() => setGallery(gallery.filter((_, i) => i !== index))}
                >
                  {translate('website-remove')}
                </Button>
              </Space>
            )
          })}
          <Button disabled={gallery.length >= MAX_GALLERY_IMAGES} onClick={() => setPicking('images')}>
            {translate('website-gallery-add')}
          </Button>
          {errors.images ? (
            <div role={'alert'} className={'ant-form-item-explain-error'}>
              {errors.images}
            </div>
          ) : null}
          {picker}
        </Space>
      )
    }
    default:
      return <div>{translate('website-section-unknown')}</div>
  }
}

// The checks the browser can make before saving; the API checks everything again.
export const checkSection = (section: IWebsiteSection): { [field: string]: string } => {
  const errors: { [field: string]: string } = {}
  if (section.type === 'hero' && typeof section.buttonUrl === 'string' && !isLink(section.buttonUrl)) {
    errors.buttonUrl = translate('website-section-bad-link')
  }
  if (section.type === 'image' && typeof section.assetId !== 'string') {
    errors.assetId = translate('website-section-image-required')
  }
  if (section.type === 'gallery' && (!Array.isArray(section.images) || section.images.length === 0)) {
    errors.images = translate('website-section-gallery-required')
  }
  if (section.type === 'contact' && typeof section.mapUrl === 'string' && getProtocol(section.mapUrl) !== 'https:') {
    errors.mapUrl = translate('website-section-bad-map-url')
  }
  return errors
}

export default SectionEditor
