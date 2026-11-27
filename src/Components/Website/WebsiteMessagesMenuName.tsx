import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Badge } from 'antd'
import { RootState } from '../../Redux/makeReduxStore'
import WebsiteService from '../../Services/WebsiteService'
import translate from '../../i18n/translate'

// The Website > Messages menu name with the count of unread messages (specs/006). Shown to admins only (the menu
// item is adminOnly); a failed count shows the name alone.
const WebsiteMessagesMenuName = () => {
  const { company } = useSelector((s: RootState) => s.auth)
  const [unread, setUnread] = useState(0)
  useEffect(() => {
    if (company?.websiteBuilderEnabled !== true) return
    let isCurrent = true
    WebsiteService.getMessages(1, 1)
      .then(({ unread: count }) => isCurrent && setUnread(count))
      .catch(() => isCurrent && setUnread(0))
    return () => {
      isCurrent = false
    }
  }, [company?.id, company?.websiteBuilderEnabled])
  return (
    <span>
      {translate('website-messages')}{' '}
      {unread > 0 ? (
        <Badge
          count={unread}
          size={'small'}
          aria-label={translate('website-messages-unread-count', { count: unread })}
        />
      ) : null}
    </span>
  )
}

export default WebsiteMessagesMenuName
