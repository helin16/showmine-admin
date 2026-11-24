import React from 'react'
import { Checkbox, Input, InputNumber } from 'antd'
import RichTextEditor from '../Form/RichTextEditor'
import Space from '../Form/Space'
import translate from '../../i18n/translate'
import { IWebsiteSection } from '../../Types/Website/IWebsite'

// One editor per section type (specs/001-website-builder, data-model "Section", US2, T035). Limits match the API's.
// Image and gallery sections need the image library (slice 8): until then they can be moved or removed, not edited.

// The types an admin can add now.
export const ADDABLE_SECTION_TYPES = ['hero', 'text', 'contact', 'articles']

export const newSection = (type: string): IWebsiteSection => {
  const id = crypto.randomUUID()
  switch (type) {
    case 'hero':
      return { id, type, heading: '' }
    case 'text':
      return { id, type, html: '' }
    case 'contact':
      return { id, type, showPhone: true, showEmail: true, showAddress: true }
    default:
      return { id, type: 'articles', count: 3 }
  }
}

// Web, email or phone links, or a page of the same site, as the API allows.
export const isLink = (value: string) =>
  /^\/[a-z0-9-]{1,40}$/.test(value) || /^(https?:\/\/[^\s]+|mailto:[^\s]+|tel:[^\s]+)$/i.test(value)

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
}

const SectionEditor = ({ section, onChange, errors = {} }: iSectionEditor) => {
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
          onChange={(html) => onChange({ ...section, html })}
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
    default:
      return <div>{translate('website-section-needs-images')}</div>
  }
}

// The checks the browser can make before saving; the API checks everything again.
export const checkSection = (section: IWebsiteSection): { [field: string]: string } => {
  const errors: { [field: string]: string } = {}
  if (section.type === 'hero' && typeof section.buttonUrl === 'string' && !isLink(section.buttonUrl)) {
    errors.buttonUrl = translate('website-section-bad-link')
  }
  if (section.type === 'contact' && typeof section.mapUrl === 'string' && !/^https:\/\/[^\s]+$/i.test(section.mapUrl)) {
    errors.mapUrl = translate('website-section-bad-map-url')
  }
  return errors
}

export default SectionEditor
