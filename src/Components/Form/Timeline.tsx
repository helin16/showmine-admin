import { Timeline as AntdTimeline, TimelineProps } from 'antd'
import { TimeLineItemProps } from 'antd/lib/timeline/TimelineItem'

type iTimeline = TimelineProps
const Timeline = ({ className, ...props }: iTimeline) => {
  return <AntdTimeline {...props} className={`app-Timeline ${className || ''}`} />
}

type iTimelineItem = TimeLineItemProps
export const TimelineItem = ({ className, ...props }: iTimelineItem) => {
  return <AntdTimeline.Item {...props} className={`app-TimelineItem ${className || ''}`} />
}

export default Timeline
