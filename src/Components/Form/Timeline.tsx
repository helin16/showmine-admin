import React from 'react'
import { Timeline as AntdTimeline, TimelineProps } from 'antd'
import { TimeLineItemProps } from 'antd/lib/timeline/TimelineItem'

type iTimeline = TimelineProps
const Timeline = ({ className, children, ...props }: iTimeline) => {
  return (
    <AntdTimeline {...props} className={`app-Timeline ${className || ''}`}>
      {/* antd only reads the props of its children, so TimelineItem never renders here and its class goes on now. */}
      {React.Children.map(children, (child) =>
        React.isValidElement<iTimelineItem>(child)
          ? React.cloneElement(child, { className: `app-TimelineItem ${child.props.className || ''}` })
          : child,
      )}
    </AntdTimeline>
  )
}

type iTimelineItem = TimeLineItemProps
export const TimelineItem = ({ className, ...props }: iTimelineItem) => {
  return <AntdTimeline.Item {...props} className={`app-TimelineItem ${className || ''}`} />
}

export default Timeline
