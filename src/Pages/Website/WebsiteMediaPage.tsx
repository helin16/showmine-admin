import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../Redux/makeReduxStore'
import { MENU_KEY_COMPANY_WEBSITE } from '../../Components/Menu/MenuItems'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import InvalidAccessPanel from '../../Components/Error/InvalidAccessPanel'
import Button from '../../Components/Form/Button'
import Card from '../../Components/Form/Card'
import PopConfirm from '../../Components/Form/Popconfirm'
import message from '../../Components/Form/message'
import { ImageLibrary } from '../../Components/Website/MediaPicker'
import translate from '../../i18n/translate'
import WebsiteService from '../../Services/WebsiteService'
import Utils from '../../Services/Utils'
import IAsset from '../../Types/Asset/IAsset'
import { IImageUse } from '../../Types/Website/IWebsite'

// The website's images (specs/001-website-builder, US5, T062): upload, see where each is used, and delete the unused
// ones. An image in use is refused by the API too (409 with usedBy).
export const describeUses = (uses: IImageUse[]) =>
  uses
    .map((use) =>
      use.published ? translate('website-image-used-published') : use.pageTitle || translate('website-image-used-site'),
    )
    .join(', ')

const WebsiteMediaPage = () => {
  const { company } = useSelector((s: RootState) => s.auth)
  const isOn = company?.websiteBuilderEnabled === true
  const [usage, setUsage] = useState<{ [assetId: string]: IImageUse[] }>({})
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [deletingId, setDeletingId] = useState<string>()
  // Images whose usage could not be checked; they can be checked again.
  const [usageFailed, setUsageFailed] = useState<string[]>([])
  const companyIdRef = useRef(company?.id)
  companyIdRef.current = company?.id

  useEffect(() => {
    setUsage({})
    setRemovedIds([])
    setUsageFailed([])
  }, [company?.id])

  const checkUsage = (ids: string[]) => {
    const companyId = company?.id
    setUsageFailed((old) => old.filter((id) => !ids.includes(id)))
    // The API answers for at most 100 ids at a time.
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100)
      WebsiteService.getImageUsage(batch)
        .then((found) => companyIdRef.current === companyId && setUsage((old) => ({ ...old, ...found })))
        .catch(() => companyIdRef.current === companyId && setUsageFailed((old) => [...old, ...batch]))
    }
  }

  // Where the shown images are used; asked again whenever the list changes.
  const imagesChanged = (images: IAsset[]) => {
    const ids = images.map((image) => `${image.id}`).filter((id) => !(id in usage) && !usageFailed.includes(id))
    if (ids.length > 0) checkUsage(ids)
  }

  const remove = (image: IAsset) => {
    const companyId = company?.id
    setDeletingId(`${image.id}`)
    WebsiteService.deleteImage(`${image.id}`)
      .then(() => {
        if (companyIdRef.current !== companyId) return
        setRemovedIds((old) => [...old, `${image.id}`])
        message.success(translate('website-image-deleted', { name: image.fileName }))
      })
      .catch((err) => {
        if (companyIdRef.current !== companyId) return
        const { status, data } = err?.response || {}
        if (status === 409 && Array.isArray(data?.usedBy)) {
          // It came into use since the list was loaded.
          setUsage((old) => ({ ...old, [`${image.id}`]: data.usedBy }))
          message.error(translate('website-image-in-use', { places: describeUses(data.usedBy) }))
        } else {
          message.error(Utils.getErrorMessage(err))
        }
      })
      .finally(() => setDeletingId(undefined))
  }

  const renderExtra = (image: IAsset) => {
    const uses = usage[`${image.id}`]
    if (usageFailed.includes(`${image.id}`)) {
      return (
        <div>
          {translate('website-image-check-failed')}{' '}
          <Button size={'small'} onClick={() => checkUsage([`${image.id}`])}>
            {translate('retry')}
          </Button>
        </div>
      )
    }
    if (uses === undefined) {
      return <div>{translate('website-image-checking')}</div>
    }
    if (uses.length > 0) {
      return (
        <div>
          {translate('website-image-used-in', { places: describeUses(uses) })}
          <div>{translate('website-image-cannot-delete')}</div>
        </div>
      )
    }
    return (
      <div>
        <div>{translate('website-image-unused')}</div>
        <PopConfirm
          title={translate('website-image-delete-confirm', { name: image.fileName })}
          okText={translate('website-delete')}
          cancelText={translate('cancel')}
          okButtonProps={{ danger: true }}
          onConfirm={() => remove(image)}
        >
          <Button
            danger
            size={'small'}
            loading={deletingId === `${image.id}`}
            aria-label={translate('website-delete-named', { name: image.fileName })}
          >
            {translate('website-delete')}
          </Button>
        </PopConfirm>
      </div>
    )
  }

  return (
    <BackendPage
      selectedMenu={MENU_KEY_COMPANY_WEBSITE}
      ContentHeader={<BackendPageContentTitle title={translate('website-images')} />}
    >
      {isOn ? (
        <Card>
          <ImageLibrary renderExtra={renderExtra} onImagesChange={imagesChanged} removedIds={removedIds} />
        </Card>
      ) : (
        <InvalidAccessPanel />
      )}
    </BackendPage>
  )
}

export default WebsiteMediaPage
