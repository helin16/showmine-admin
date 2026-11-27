import React, { useState } from 'react'
import { Checkbox, Input, InputNumber, Radio } from 'antd'
import Button from '../Form/Button'
import RichTextEditor from '../Form/RichTextEditor'
import MediaPicker from './MediaPicker'
import IAsset from '../../Types/Asset/IAsset'
import Space from '../Form/Space'
import translate from '../../i18n/translate'
import { IWebsiteSection } from '../../Types/Website/IWebsite'

// One editor per section type (specs/001-website-builder, data-model "Section", US2 T035, US5 T062). Limits match the
// API's. Images are chosen from the company's website images with the media picker.

export const ADDABLE_SECTION_TYPES = [
  'hero',
  'split',
  'cards',
  'pricing',
  'text',
  'image',
  'gallery',
  'contact',
  'map',
  'form',
  'articles',
]
export const MAX_GALLERY_IMAGES = 24
export const MAX_CARDS = 12
export const MAX_PLANS = 4
export const MAX_FEATURES = 10
export const MAX_FEATURE_LENGTH = 100

type iGalleryImage = { assetId: string; alt?: string }
// A card of a card grid (specs/005-website-blocks, slice 88b).
type iCard = { imageAssetId?: string; title?: string; text?: string; link?: string }
const getCards = (section: IWebsiteSection) => (Array.isArray(section.items) ? (section.items as iCard[]) : [])
// A plan of a pricing block (spec 005, slice 88c).
type iPlan = {
  name?: string
  price?: string
  period?: string
  features?: string[]
  buttonText?: string
  buttonUrl?: string
  highlight?: boolean
}
const getPlans = (section: IWebsiteSection) => (Array.isArray(section.plans) ? (section.plans as iPlan[]) : [])
const MAP_HEIGHTS = ['small', 'medium', 'large']

// Every image id a page's sections use.
export const getImageIds = (sections: IWebsiteSection[]) =>
  Array.from(
    new Set(
      sections.flatMap((section) => [
        ...(typeof section.imageAssetId === 'string' ? [section.imageAssetId] : []),
        ...(typeof section.assetId === 'string' ? [section.assetId] : []),
        ...(Array.isArray(section.images) ? (section.images as iGalleryImage[]).map((image) => image.assetId) : []),
        ...getCards(section).flatMap((card) => (typeof card?.imageAssetId === 'string' ? [card.imageAssetId] : [])),
      ]),
    ),
  )

export const newSection = (type: string): IWebsiteSection => {
  const id = crypto.randomUUID()
  switch (type) {
    case 'hero':
      return { id, type, heading: '' }
    case 'split':
      return { id, type, heading: '', imageSide: 'left' }
    case 'cards':
      return { id, type, columns: '3', items: [{}] }
    case 'pricing':
      return { id, type, plans: [{ name: '', price: '' }] }
    case 'map':
      return { id, type, height: 'medium' }
    case 'form':
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

const HUBSPOT_PATTERNS: [string, RegExp][] = [
  ['hubspotPortalId', /^[0-9]{1,12}$/],
  ['hubspotFormId', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i],
  // Not a field the visitor fills, which it would overwrite.
  ['hubspotMessageField', /^(?!(?:email|firstname|lastname)$)[a-z0-9_]{1,100}$/],
]

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
export const Thumbnail = ({ id, images }: { id: string; images: { [assetId: string]: IAsset | null } }) => {
  const image = images[id]
  if (image === undefined) return <span>{translate('website-image-loading')}</span>
  if (image === null) return <span className={'ant-form-item-explain-error'}>{translate('website-image-missing')}</span>
  return <img src={image.url} alt={image.fileName} style={{ maxWidth: 160, maxHeight: 100 }} />
}

const SectionEditor = ({ section, onChange, errors = {}, images = {}, onImagesPicked }: iSectionEditor) => {
  // Which image the picker is choosing: a single field, or more for the gallery.
  // The image being picked: a field, the gallery, or the card at an index.
  const [picking, setPicking] = useState<'imageAssetId' | 'assetId' | 'images' | number>()
  // Read by screen readers after a gallery image moves.
  const [announcement, setAnnouncement] = useState('')
  const picked = (assets: IAsset[]) => {
    onImagesPicked?.(assets)
    if (picking === 'images') {
      const old = (section.images as iGalleryImage[]) || []
      onChange({ ...section, images: [...old, ...assets.map((asset) => ({ assetId: `${asset.id}` }))] })
    } else if (typeof picking === 'number') {
      onChange({
        ...section,
        items: getCards(section).map((card, i) =>
          i === picking ? { ...card, imageAssetId: `${assets[0].id}` } : card,
        ),
      })
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

  // A band's buttons (spec 005): the first, a second and a small note under them.
  const buttonFields = (
    <>
      {field('buttonText', translate('website-section-button-text'), text('buttonText', 40))}
      {field('buttonUrl', translate('website-section-button-url'), text('buttonUrl', 2000))}
      {field('button2Text', translate('website-section-button2-text'), text('button2Text', 40))}
      {field('button2Url', translate('website-section-button2-url'), text('button2Url', 2000))}
      {field('note', translate('website-section-note'), text('note', 200))}
    </>
  )

  switch (section.type) {
    case 'hero':
      return (
        <Space orientation={'vertical'} style={{ width: '100%' }}>
          {field('heading', translate('website-section-heading'), text('heading', 120))}
          {imageField('imageAssetId', translate('website-section-hero-image'), true)}
          {picker}
          {field('subheading', translate('website-section-subheading'), text('subheading', 300, true))}
          {buttonFields}
        </Space>
      )
    // Image beside text (specs/005-website-blocks, slice 88a).
    case 'split':
      return (
        <Space orientation={'vertical'} style={{ width: '100%' }}>
          {field('heading', translate('website-section-heading'), text('heading', 120))}
          {field('text', translate('website-section-plain-text'), text('text', 1000, true))}
          {imageField('imageAssetId', translate('website-section-image'), false)}
          {picker}
          {field('imageAlt', translate('website-section-alt'), text('imageAlt', 200))}
          <div>
            <div id={fieldId('imageSide')}>{translate('website-section-image-side')}</div>
            <Radio.Group
              aria-labelledby={fieldId('imageSide')}
              value={section.imageSide === 'right' ? 'right' : 'left'}
              onChange={(e) => set('imageSide', e.target.value)}
            >
              <Radio value={'left'}>{translate('website-section-image-left')}</Radio>
              <Radio value={'right'}>{translate('website-section-image-right')}</Radio>
            </Radio.Group>
          </div>
          {buttonFields}
        </Space>
      )
    // Card grid (specs/005-website-blocks, slice 88b).
    case 'cards': {
      const cards = getCards(section)
      const setCards = (next: iCard[]) => onChange({ ...section, items: next })
      const setCard = (index: number, name: keyof iCard, value?: string) =>
        setCards(
          cards.map((card, i) => {
            if (i !== index) return card
            const next = { ...card, [name]: value }
            // An empty field is left out, as the API refuses an empty link.
            if (!value) delete next[name]
            return next
          }),
        )
      const moveCard = (index: number, by: number) => {
        const next = [...cards]
        const [card] = next.splice(index, 1)
        next.splice(index + by, 0, card)
        setCards(next)
        setAnnouncement(translate('website-card-moved', { number: index + by + 1 }))
      }
      const cardText = (
        index: number,
        name: 'title' | 'text' | 'link',
        label: string,
        max: number,
        multiLine = false,
      ) => {
        const id = fieldId(`items-${index}-${name}`)
        const error = errors[`items[${index}].${name}`]
        const props = {
          id,
          value: `${cards[index][name] ?? ''}`,
          maxLength: max,
          status: error ? ('error' as const) : undefined,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': error ? `${id}-error` : undefined,
        }
        return (
          <Field id={id} label={label} error={error}>
            {multiLine ? (
              <Input.TextArea
                {...props}
                autoSize={{ minRows: 2 }}
                onChange={(e) => setCard(index, name, e.target.value)}
              />
            ) : (
              <Input {...props} onChange={(e) => setCard(index, name, e.target.value)} />
            )}
          </Field>
        )
      }
      const columns = ['2', '3', '4'].includes(`${section.columns}`) ? `${section.columns}` : '3'
      return (
        <Space orientation={'vertical'} style={{ width: '100%' }}>
          {field('heading', translate('website-section-heading'), text('heading', 120))}
          {field('intro', translate('website-section-intro'), text('intro', 500, true))}
          <div>
            <div id={fieldId('columns')}>{translate('website-section-columns')}</div>
            <Radio.Group
              aria-labelledby={fieldId('columns')}
              value={columns}
              onChange={(e) => set('columns', e.target.value)}
            >
              {['2', '3', '4'].map((count) => (
                <Radio key={count} value={count}>
                  {count}
                </Radio>
              ))}
            </Radio.Group>
          </div>
          <Checkbox
            checked={section.boxed === true}
            onChange={(e) => onChange({ ...section, boxed: e.target.checked })}
          >
            {translate('website-section-boxed')}
          </Checkbox>
          {cards.map((card, index) => {
            const name = translate('website-card-number', { number: index + 1 })
            const imageError = errors[`items[${index}].imageAssetId`]
            return (
              // eslint-disable-next-line react/no-array-index-key
              <div key={index} role={'group'} aria-label={name} className={'website-card-editor'}>
                <strong>{name}</strong>
                <div className={'website-section-field'}>
                  <div>{translate('website-card-image')}</div>
                  <Space wrap>
                    {card.imageAssetId ? (
                      <Thumbnail id={card.imageAssetId} images={images} />
                    ) : (
                      <span>{translate('website-image-none')}</span>
                    )}
                    <Button onClick={() => setPicking(index)}>
                      {translate(card.imageAssetId ? 'website-image-change' : 'website-image-choose')}
                    </Button>
                    {card.imageAssetId ? (
                      <Button onClick={() => setCard(index, 'imageAssetId')}>
                        {translate('website-image-remove')}
                      </Button>
                    ) : null}
                  </Space>
                  {imageError ? (
                    <div role={'alert'} className={'ant-form-item-explain-error'}>
                      {imageError}
                    </div>
                  ) : null}
                </div>
                {cardText(index, 'title', translate('website-card-title'), 80)}
                {cardText(index, 'text', translate('website-card-text'), 300, true)}
                {cardText(index, 'link', translate('website-card-link'), 2000)}
                <Space>
                  <Button
                    aria-label={translate('website-move-up', { name })}
                    disabled={index === 0}
                    onClick={() => moveCard(index, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    aria-label={translate('website-move-down', { name })}
                    disabled={index === cards.length - 1}
                    onClick={() => moveCard(index, 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    aria-label={translate('website-remove-named', { name })}
                    onClick={() => setCards(cards.filter((_, i) => i !== index))}
                  >
                    {translate('website-remove')}
                  </Button>
                </Space>
              </div>
            )
          })}
          <Button disabled={cards.length >= MAX_CARDS} onClick={() => setCards([...cards, {}])}>
            {translate('website-card-add')}
          </Button>
          <small>{translate('website-card-count', { count: cards.length, max: MAX_CARDS })}</small>
          <div aria-live={'polite'} style={{ position: 'absolute', left: -10000 }}>
            {announcement}
          </div>
          {errors.items ? (
            <div role={'alert'} className={'ant-form-item-explain-error'}>
              {errors.items}
            </div>
          ) : null}
          {picker}
        </Space>
      )
    }
    // Pricing plans (specs/005-website-blocks, slice 88c). Features are typed one per line.
    case 'pricing': {
      const plans = getPlans(section)
      const setPlans = (next: iPlan[]) => onChange({ ...section, plans: next })
      const setPlan = (index: number, changes: Partial<iPlan>) =>
        setPlans(
          plans.map((plan, i) => {
            if (i !== index) return plan
            const next: iPlan = { ...plan, ...changes }
            // An empty optional field is left out, as the API refuses an empty link; name and price stay.
            ;(['period', 'buttonText', 'buttonUrl'] as const).forEach((name) => {
              if (next[name] === '') delete next[name]
            })
            if (next.features?.length === 0) delete next.features
            if (next.highlight === false) delete next.highlight
            return next
          }),
        )
      const movePlan = (index: number, by: number) => {
        const next = [...plans]
        const [plan] = next.splice(index, 1)
        next.splice(index + by, 0, plan)
        setPlans(next)
        setAnnouncement(translate('website-plan-moved', { number: index + by + 1 }))
      }
      const planText = (
        index: number,
        name: 'name' | 'price' | 'period' | 'buttonText' | 'buttonUrl',
        label: string,
        max: number,
      ) => {
        const id = fieldId(`plans-${index}-${name}`)
        const error = errors[`plans[${index}].${name}`]
        return (
          <Field id={id} label={label} error={error}>
            <Input
              id={id}
              value={`${plans[index][name] ?? ''}`}
              maxLength={max}
              status={error ? 'error' : undefined}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              onChange={(e) => setPlan(index, { [name]: e.target.value })}
            />
          </Field>
        )
      }
      return (
        <Space orientation={'vertical'} style={{ width: '100%' }}>
          {field('heading', translate('website-section-heading'), text('heading', 120))}
          {field('intro', translate('website-section-intro'), text('intro', 500, true))}
          {plans.map((plan, index) => {
            const name = translate('website-plan-number', { number: index + 1 })
            const featuresId = fieldId(`plans-${index}-features`)
            const featuresError =
              errors[`plans[${index}].features`] ||
              Object.entries(errors).find(([path]) => path.startsWith(`plans[${index}].features[`))?.[1]
            return (
              // eslint-disable-next-line react/no-array-index-key
              <div key={index} role={'group'} aria-label={name} className={'website-card-editor'}>
                <strong>{name}</strong>
                {planText(index, 'name', translate('website-plan-name'), 40)}
                {planText(index, 'price', translate('website-plan-price'), 20)}
                {planText(index, 'period', translate('website-plan-period'), 20)}
                <Field id={featuresId} label={translate('website-plan-features')} error={featuresError}>
                  <Input.TextArea
                    id={featuresId}
                    value={(plan.features || []).join('\n')}
                    autoSize={{ minRows: 3 }}
                    status={featuresError ? 'error' : undefined}
                    aria-invalid={featuresError ? true : undefined}
                    aria-describedby={featuresError ? `${featuresId}-error` : undefined}
                    onChange={(e) =>
                      setPlan(index, { features: e.target.value === '' ? [] : e.target.value.split('\n') })
                    }
                    // Blank lines are dropped on leaving the box, so they never count against the 10.
                    onBlur={() => {
                      const lines = plan.features || []
                      const kept = lines.filter((line) => line.trim())
                      if (kept.length !== lines.length) setPlan(index, { features: kept })
                    }}
                  />
                </Field>
                {planText(index, 'buttonText', translate('website-section-button-text'), 40)}
                {planText(index, 'buttonUrl', translate('website-section-button-url'), 2000)}
                <Checkbox
                  checked={plan.highlight === true}
                  onChange={(e) => setPlan(index, { highlight: e.target.checked })}
                >
                  {translate('website-plan-highlight')}
                </Checkbox>
                <Space>
                  <Button
                    aria-label={translate('website-move-up', { name })}
                    disabled={index === 0}
                    onClick={() => movePlan(index, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    aria-label={translate('website-move-down', { name })}
                    disabled={index === plans.length - 1}
                    onClick={() => movePlan(index, 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    aria-label={translate('website-remove-named', { name })}
                    onClick={() => setPlans(plans.filter((_, i) => i !== index))}
                  >
                    {translate('website-remove')}
                  </Button>
                </Space>
              </div>
            )
          })}
          <Button disabled={plans.length >= MAX_PLANS} onClick={() => setPlans([...plans, { name: '', price: '' }])}>
            {translate('website-plan-add')}
          </Button>
          <small>{translate('website-plan-count', { count: plans.length, max: MAX_PLANS })}</small>
          <div aria-live={'polite'} style={{ position: 'absolute', left: -10000 }}>
            {announcement}
          </div>
          {errors.plans ? (
            <div role={'alert'} className={'ant-form-item-explain-error'}>
              {errors.plans}
            </div>
          ) : null}
        </Space>
      )
    }
    // Message form (specs/006-website-message-form): the visitor's fields are fixed; the block sets its words.
    case 'form':
      return (
        <Space orientation={'vertical'} style={{ width: '100%' }}>
          <div>{translate('website-form-help')}</div>
          {field('heading', translate('website-section-heading'), text('heading', 120))}
          {field('intro', translate('website-section-intro'), text('intro', 500, true))}
          {field('buttonText', translate('website-form-button'), text('buttonText', 40))}
          {field('thanks', translate('website-form-thanks'), text('thanks', 300, true))}
          {/* specs/007-website-hubspot-map: also sent on to a HubSpot form; our email can be switched off. */}
          <div>{translate('website-form-hubspot-help')}</div>
          {field('hubspotPortalId', translate('website-form-hubspot-portal'), text('hubspotPortalId', 12))}
          {field('hubspotFormId', translate('website-form-hubspot-form'), text('hubspotFormId', 36))}
          {field('hubspotMessageField', translate('website-form-hubspot-field'), text('hubspotMessageField', 100))}
          <Checkbox checked={section.noEmail === true} onChange={(e) => set('noEmail', e.target.checked || undefined)}>
            {translate('website-form-no-email')}
          </Checkbox>
        </Space>
      )
    // A map on its own (spec 005, slice 88c).
    case 'map':
      return (
        <Space orientation={'vertical'} style={{ width: '100%' }}>
          {field('mapUrl', translate('website-section-map-url'), text('mapUrl', 2000))}
          {field('chinaMapUrl', translate('website-map-china-url'), text('chinaMapUrl', 2000))}
          <div>
            <div id={fieldId('height')}>{translate('website-map-height')}</div>
            <Radio.Group
              aria-labelledby={fieldId('height')}
              value={MAP_HEIGHTS.includes(`${section.height}`) ? section.height : 'medium'}
              onChange={(e) => set('height', e.target.value)}
            >
              {MAP_HEIGHTS.map((height) => (
                <Radio key={height} value={height}>
                  {translate(`website-map-height-${height}`)}
                </Radio>
              ))}
            </Radio.Group>
          </div>
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
        setAnnouncement(translate('website-gallery-moved', { number: index + by + 1 }))
      }
      // Rows keep their identity when moved: the image id, and which copy of it when it is used twice.
      const keys = gallery.map((image, index) => {
        const copy = gallery.slice(0, index).filter((g) => g.assetId === image.assetId).length
        return `${image.assetId}-${copy}`
      })
      return (
        <Space orientation={'vertical'} style={{ width: '100%' }}>
          {gallery.map((image, index) => {
            const name = translate('website-gallery-image', { number: index + 1 })
            const altId = `${section.id}-images-${index}-alt`
            const altError = errors[`images[${index}].alt`] || errors[`images[${index}].assetId`]
            return (
              <Space key={keys[index]} wrap align={'start'}>
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
          <div aria-live={'polite'} style={{ position: 'absolute', left: -10000 }}>
            {announcement}
          </div>
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
  if (section.type === 'hero' || section.type === 'split') {
    ;(['buttonUrl', 'button2Url'] as const).forEach((name) => {
      if (typeof section[name] === 'string' && !isLink(section[name] as string)) {
        errors[name] = translate('website-section-bad-link')
      }
    })
    // The second button needs both, as the API says (spec 005); the first keeps accepting one alone.
    const hasText = typeof section.button2Text === 'string'
    if (hasText !== (typeof section.button2Url === 'string')) {
      errors[hasText ? 'button2Url' : 'button2Text'] = translate('website-section-button2-both')
    }
  }
  if (section.type === 'cards') {
    const cards = getCards(section)
    if (cards.length === 0) errors.items = translate('website-section-cards-required')
    cards.forEach((card, index) => {
      if (typeof card?.link === 'string' && !isLink(card.link)) {
        errors[`items[${index}].link`] = translate('website-section-bad-link')
      }
    })
  }
  if (section.type === 'pricing') {
    const plans = getPlans(section)
    if (plans.length === 0) errors.plans = translate('website-section-plans-required')
    plans.forEach((plan, index) => {
      if (!`${plan?.name ?? ''}`.trim()) errors[`plans[${index}].name`] = translate('website-section-required')
      if (!`${plan?.price ?? ''}`.trim()) errors[`plans[${index}].price`] = translate('website-section-required')
      const lines = (plan?.features || []).filter((line) => `${line}`.trim())
      if (lines.length > MAX_FEATURES) {
        errors[`plans[${index}].features`] = translate('website-plan-features-max', { max: MAX_FEATURES })
      } else if (lines.some((line) => `${line}`.length > MAX_FEATURE_LENGTH)) {
        errors[`plans[${index}].features`] = translate('website-plan-feature-long', { max: MAX_FEATURE_LENGTH })
      }
      if (typeof plan?.buttonUrl === 'string' && !isLink(plan.buttonUrl)) {
        errors[`plans[${index}].buttonUrl`] = translate('website-section-bad-link')
      }
    })
  }
  if (section.type === 'map' && getProtocol(`${section.mapUrl ?? ''}`) !== 'https:') {
    errors.mapUrl = translate('website-section-bad-map-url')
  }
  if (
    section.type === 'map' &&
    typeof section.chinaMapUrl === 'string' &&
    getProtocol(section.chinaMapUrl) !== 'https:'
  ) {
    errors.chinaMapUrl = translate('website-section-bad-map-url')
  }
  if (section.type === 'form') {
    // The same rules as the API's (spec 007): the two ids both or neither.
    HUBSPOT_PATTERNS.forEach(([name, pattern]) => {
      const value = section[name]
      if (typeof value === 'string' && !pattern.test(value)) errors[name] = translate(`website-form-bad-${name}`)
    })
    const hasPortal = typeof section.hubspotPortalId === 'string'
    if (hasPortal !== (typeof section.hubspotFormId === 'string')) {
      errors[hasPortal ? 'hubspotFormId' : 'hubspotPortalId'] = translate('website-section-required')
    }
  }
  if (section.type === 'split' && typeof section.imageAssetId !== 'string') {
    errors.imageAssetId = translate('website-section-image-required')
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
