import React from 'react'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWordpress } from '@fortawesome/free-brands-svg-icons'
import {
  APP_ICON_PATH,
  CHANNEL_TYPE_FACEBOOK,
  CHANNEL_TYPE_GOOGLE,
  CHANNEL_TYPE_TWITTER,
  CHANNEL_TYPE_LINKED_IN,
  CHANNEL_TYPE_WORDPRESS,
  FACEBOOK_MAIN_COLOR,
  GOOGLE_MAIN_COLOR,
  TWITTER_MAIN_COLOR,
  LINKED_IN_MAIN_COLOR,
  WORDPRESS_MAIN_COLOR,
} from '../../Constants'
import IChannel from '../../Types/Channel/IChannel'
import Icons from '../Icons'
import Image from '../Form/Image'

const size = '32px'
const ChannelIconWrapper = styled.div`
  font-size: ${size};
  &.facebook {
    color: ${FACEBOOK_MAIN_COLOR};
  }
  &.google {
    color: ${GOOGLE_MAIN_COLOR};
  }
  &.twitter {
    color: ${TWITTER_MAIN_COLOR};
  }
  &.linkedin {
    color: ${LINKED_IN_MAIN_COLOR};
  }
  &.wordpress {
    color: ${WORDPRESS_MAIN_COLOR};
  }
  img {
    width: ${size} !important;
    height: auto;
  }
`

/**
 *
 * @param channel
 */
const ChannelIcon = ({ channel, ...props }: React.ComponentProps<any> & { channel: IChannel }) => {
  // eslint-disable-line
  const channelName = `${channel.type || ''}`.toLowerCase()
  const getIcon = () => {
    if (channelName === CHANNEL_TYPE_FACEBOOK.toLowerCase()) {
      return <Icons.FacebookFilled />
    }
    if (channelName === CHANNEL_TYPE_GOOGLE.toLowerCase()) {
      return <Icons.GoogleSquareFilled />
    }
    if (channelName === CHANNEL_TYPE_TWITTER.toLowerCase()) {
      return <Icons.TwitterSquareFilled />
    }
    if (channelName === CHANNEL_TYPE_LINKED_IN.toLowerCase()) {
      return <Icons.LinkedinFilled />
    }
    if (channelName === CHANNEL_TYPE_WORDPRESS.toLowerCase()) {
      return <FontAwesomeIcon icon={faWordpress} widthAuto />
    }
    return <Image src={APP_ICON_PATH} />
  }

  return (
    <ChannelIconWrapper className={channelName} {...props}>
      {getIcon()}
    </ChannelIconWrapper>
  )
}

export default ChannelIcon
