import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Upload } from 'antd'
import type { UploadChangeParam, UploadFile } from 'antd/es/upload'
import { RootState } from '../../Redux/makeReduxStore'
import Alert from '../Form/Alert'
import Button from '../Form/Button'
import Col from '../Form/Col'
import Empty from '../Form/Empty'
import Modal from '../Form/Modal'
import Progress from '../Form/Progress'
import Row from '../Form/Row'
import Space from '../Form/Space'
import Spin from '../Form/Spin'
import message from '../Form/message'
import translate from '../../i18n/translate'
import AppService from '../../Services/AppService'
import Utils from '../../Services/Utils'
import WebsiteService from '../../Services/WebsiteService'
import IAsset from '../../Types/Asset/IAsset'

// The company's website images (specs/001-website-builder, US5, T062): a grid with upload, used by the picker dialog
// and the images page.
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export const formatSize = (bytes?: number | null) => {
  const size = Number(bytes) || 0
  return size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`
}

// The API's refusal of an upload, in words. The same status can mean different things (403 is a full plan or the
// builder turned off), so its message decides; anything else shows the API's own words.
export const describeUploadRefusal = (status?: number, response?: unknown) => {
  const apiMessage = `${(response as { message?: string } | undefined)?.message || ''}`
  if (status === 413) return translate('website-image-too-large')
  if (status === 400 && apiMessage === 'Invalid type.') return translate('website-image-bad-type')
  if (status === 403 && /^Your plan.s storage is full\.$/.test(apiMessage))
    return translate('website-image-storage-full')
  return apiMessage || AppService.getUploadFailure(status, response) || translate('website-image-upload-failed')
}

// Adds a page of images, leaving out any already shown (an upload shifts the pages by one).
const appendNew = (old: IAsset[], more: IAsset[]) => [...old, ...more.filter((m) => !old.some((o) => o.id === m.id))]

type iImageLibrary = {
  // Selected image ids, in the order chosen; given when images can be picked.
  selectedIds?: string[]
  onToggle?: (asset: IAsset) => void
  // More for each image, such as where it is used.
  renderExtra?: (asset: IAsset) => React.ReactNode
  onImagesChange?: (images: IAsset[]) => void
  // Images deleted by the page, no longer shown.
  removedIds?: string[]
  onUploaded?: (asset: IAsset) => void
}

export const ImageLibrary = ({
  selectedIds,
  onToggle,
  renderExtra,
  onImagesChange,
  removedIds = [],
  onUploaded,
}: iImageLibrary) => {
  const { company } = useSelector((s: RootState) => s.auth)
  const [images, setImages] = useState<IAsset[]>([])
  const [page, setPage] = useState({ current: 1, pages: 1 })
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string>()
  const [percent, setPercent] = useState<number>()
  const [count, setCount] = useState(0)
  const companyIdRef = useRef(company?.id)
  companyIdRef.current = company?.id
  // The company an upload was started for; one that finishes after a switch is not shown.
  const uploadCompanyRef = useRef<string | undefined>(undefined)

  const load = (currentPage: number) => {
    const companyId = company?.id
    setLoading(true)
    setLoadError(undefined)
    return WebsiteService.getImages(currentPage)
      .then((res) => {
        if (companyIdRef.current !== companyId) return
        setImages((old) => (currentPage === 1 ? res.data : appendNew(old, res.data)))
        setPage({ current: res.currentPage, pages: res.pages })
      })
      .catch((err) => companyIdRef.current === companyId && setLoadError(Utils.getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  // Another company's images never stay on screen while this one's load.
  useEffect(() => {
    setImages([])
    setPage({ current: 1, pages: 1 })
  }, [company?.id])

  // A delete shifts the later pages back by one, so the list starts again from the first page.
  useEffect(() => {
    load(1)
  }, [company?.id, count, removedIds.length])

  const shown = images.filter((image) => !removedIds.includes(`${image.id}`))
  useEffect(() => {
    onImagesChange?.(shown)
  }, [images, removedIds.join(',')])

  // Checked here first, so a wrong file is never sent; the API checks again.
  const beforeUpload = (file: File) => {
    if (!IMAGE_TYPES.includes(file.type)) {
      message.error(translate('website-image-bad-type'))
      return Upload.LIST_IGNORE
    }
    if (file.size > MAX_IMAGE_BYTES) {
      message.error(translate('website-image-too-large'))
      return Upload.LIST_IGNORE
    }
    uploadCompanyRef.current = company?.id
    return true
  }

  const uploadChanged = ({ file }: UploadChangeParam<UploadFile<IAsset>>) => {
    if (file.status === 'uploading') {
      setPercent(Math.round(file.percent || 0))
    } else if (file.status === 'done' || file.status === 'error') {
      setPercent(undefined)
    }
    if (uploadCompanyRef.current !== companyIdRef.current) {
      return
    }
    if (file.status === 'done' && file.response) {
      const asset = file.response
      setImages((old) => [asset, ...old.filter((o) => o.id !== asset.id)])
      message.success(translate('website-image-uploaded', { name: asset.fileName }))
      onUploaded?.(asset)
    } else if (file.status === 'error') {
      message.error(describeUploadRefusal((file.error as { status?: number } | undefined)?.status, file.response))
    }
  }

  return (
    <Space orientation={'vertical'} style={{ width: '100%' }}>
      <Upload.Dragger
        name={'file'}
        accept={'.jpg,.jpeg,.png,.webp,.gif'}
        showUploadList={false}
        action={WebsiteService.getImageUploadUrl()}
        headers={AppService.getHeaders().headers}
        beforeUpload={beforeUpload}
        onChange={uploadChanged}
        disabled={percent !== undefined}
      >
        <p>{translate('website-image-upload')}</p>
        <p>{translate('website-image-upload-help')}</p>
      </Upload.Dragger>
      {percent !== undefined ? <Progress percent={percent} aria-label={translate('website-image-uploading')} /> : null}
      {loadError ? (
        <Alert
          type={'error'}
          message={translate('website-images-load-failed', { message: loadError })}
          action={<Button onClick={() => setCount((c) => c + 1)}>{translate('retry')}</Button>}
        />
      ) : null}
      <Spin spinning={loading}>
        {shown.length === 0 && !loading && !loadError ? (
          <Empty description={translate('website-images-none')} />
        ) : (
          <Row gutter={[12, 12]}>
            {shown.map((image) => {
              const order = selectedIds ? selectedIds.indexOf(`${image.id}`) : -1
              return (
                <Col xs={12} sm={8} md={6} key={image.id}>
                  <div className={'website-image'}>
                    {onToggle ? (
                      <Button
                        type={order >= 0 ? 'primary' : 'default'}
                        aria-pressed={order >= 0}
                        aria-label={
                          order >= 0
                            ? translate('website-image-selected', { name: image.fileName, number: order + 1 })
                            : translate('website-image-select', { name: image.fileName })
                        }
                        onClick={() => onToggle(image)}
                        style={{ height: 'auto', padding: 4, width: '100%' }}
                      >
                        <img src={image.url} alt={image.fileName} style={{ maxWidth: '100%', maxHeight: 120 }} />
                        {order >= 0 ? <span>{order + 1}</span> : null}
                      </Button>
                    ) : (
                      <img src={image.url} alt={image.fileName} style={{ maxWidth: '100%', maxHeight: 120 }} />
                    )}
                    <div>
                      {image.fileName} · {formatSize(image.fileSize)}
                    </div>
                    {renderExtra ? renderExtra(image) : null}
                  </div>
                </Col>
              )
            })}
          </Row>
        )}
      </Spin>
      {page.current < page.pages ? (
        <Button onClick={() => load(page.current + 1)} loading={loading}>
          {translate('website-images-more')}
        </Button>
      ) : null}
    </Space>
  )
}

type iMediaPicker = {
  open: boolean
  // Several images in order (a gallery), up to `max`; otherwise one.
  multiple?: boolean
  max?: number
  onCancel: () => void
  onPick: (images: IAsset[]) => void
}

// Choose website images, uploading new ones on the way.
const MediaPicker = ({ open, multiple = false, max = 24, onCancel, onPick }: iMediaPicker) => {
  const [selected, setSelected] = useState<IAsset[]>([])

  useEffect(() => {
    if (open) setSelected([])
  }, [open])

  const toggle = (asset: IAsset) =>
    setSelected((old) => {
      if (old.some((a) => a.id === asset.id)) return old.filter((a) => a.id !== asset.id)
      if (!multiple) return [asset]
      if (old.length >= max) {
        message.error(translate('website-images-max', { max }))
        return old
      }
      return [...old, asset]
    })

  if (!open) return null
  return (
    <Modal
      open
      width={'80%'}
      title={translate(multiple ? 'website-images-pick-several' : 'website-images-pick-one')}
      okText={translate('website-images-use', { count: selected.length })}
      okButtonProps={{ disabled: selected.length === 0 }}
      cancelText={translate('cancel')}
      onOk={() => onPick(selected)}
      onCancel={onCancel}
    >
      <ImageLibrary
        selectedIds={selected.map((a) => `${a.id}`)}
        onToggle={toggle}
        // A new upload is chosen straight away, as the admin most likely wants it.
        onUploaded={(asset) => toggle(asset)}
      />
    </Modal>
  )
}

export default MediaPicker
