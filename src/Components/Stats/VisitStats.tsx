import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import moment from 'moment'
import { useIntl } from 'react-intl'
import CompanyService from '../../Services/CompanyService'
import ICompany from '../../Types/Company/ICompany'
import VisitsByChannelChart from './VisitsByChannelChart'
import VisitsBySharerChart from './VisitsBySharerChart'
import VisitsByChannelLineChart from './VisitsByChannelLineChart'
import IArticle from '../../Types/Article/IArticle'
import Row from '../Form/Row'
import Col from '../Form/Col'
import { BoxTitleDiv, BoxTitleSuffix, listGutter } from '../../Styles/AppWrapper'
import List, { ListItem } from '../Form/List'
import Icons from '../Icons'
import Button from '../Form/Button'
import Dropdown from '../Form/Dropdown'
import { useSelector } from 'react-redux'
import { RootState } from '../../Redux/makeReduxStore'
import { OP_GTE } from '../../Helpers/ServiceHelper'
import IItemVisit from '../../Types/Article/IItemVisit'

const StatsWrapper = styled.div``

type iState = {
  initLoading: boolean
  recentDays: 10
  stats: IItemVisit[]
}
const initialState: iState = {
  initLoading: false,
  recentDays: 10,
  stats: [],
}

const VisitStats = ({ article }: { article?: IArticle }) => {
  return null
  // const [state, setState] = useState(initialState);
  // const { company } = useSelector((s: RootState) => s.auth);
  // const intl = useIntl();
  // /**
  //  * getting all stats for an company
  //  */
  // useEffect(() => {
  //   if (company === undefined || !company.id || !article || !article.id || `${article.id || ''}`.trim() === '') {
  //     return;
  //   }
  //   setState((s) => ({ ...s, initLoading: true }));
  //   let isCancelled = false;
  //   ItemVisitService.getAll({
  //       where: JSON.stringify({itemId: article.id, createdAt: {[OP_GTE]: moment().subtract(state.recentDays, 'day').toISOString(), isActive: true}}),
  //       perPage: 999999,
  //     })
  //     .then((res) => {
  //       if (isCancelled === true) return;
  //       setState((s) => ({
  //         ...s,
  //         stats: res.data,
  //         initLoading: false,
  //       }));
  //     });
  //   return () => { // eslint-disable-line
  //     isCancelled = true;
  //   };
  // }, [company, article, state.recentDays]);
  //
  // /**
  //  *
  //  * @param days
  //  */
  // const formatRecentDays = (days: number) => {
  //   if (days >= 365) {
  //     return intl.formatMessage({ id: 'latest_year' }, { number: '1' });
  //   }
  //   if (days >= 30) {
  //     return intl.formatMessage({ id: 'latest_month' }, { number: '1' });
  //   }
  //   if (days <= 1) {
  //     return intl.formatMessage({ id: 'latest_day' }, { number: '1' });
  //   }
  //   // return `Latest ${days} days`;
  //   return intl.formatMessage({ id: 'latest_day' }, { number: days });
  // };
  // /**
  //  *
  //  * @param e
  //  */
  // const changeDays = (item: any) => { // eslint-disable-line
  //   setState({
  //     ...state,
  //     recentDays: item.key,
  //   });
  // };
  //
  // /**
  //  *
  //  */
  // return (
  //   <StatsWrapper>
  //     <Row>
  //       <Col flex="auto">
  //         <BoxTitleDiv>{intl.formatMessage({ id: 'visit_stats' })}:
  //           <BoxTitleSuffix>{moment().subtract(state.recentDays, 'days').format('ll')}</BoxTitleSuffix>
  //         </BoxTitleDiv>
  //       </Col>
  //       <Col flex="180px">
  //         <div style={{ textAlign: 'right' }}>
  //           <Dropdown menu={{
  //             items: [1, 7, 14, 30, 365].map((days) => ({ key: days, label: formatRecentDays(days)})),
  //             onClick: changeDays,
  //           }}>
  //             <Button type={'text'}>
  //               {formatRecentDays(state.recentDays)} <Icons.DownOutlined />
  //             </Button>
  //           </Dropdown>
  //         </div>
  //       </Col>
  //     </Row>
  //     <List
  //       className="visit-stats-list"
  //       loading={state.initLoading}
  //       grid={{
  //         gutter: listGutter,
  //         xs: 1,
  //         sm: 1,
  //         md: 1,
  //         lg: 3,
  //         xl: 3,
  //         xxl: 3,
  //       }}
  //       dataSource={Object.keys(state.stats)}
  //       renderItem={(key: string) => (
  //         <ListItem>
  //           {
  //             key === 'channelPortion' ? <VisitsByChannelChart title={intl.formatMessage({ id: 'visit_channel' })} items={state.stats[key]} />
  //               : null
  //           }
  //           {
  //             key === 'visitTrend' ? <VisitsByChannelLineChart title={intl.formatMessage({ id: 'trend_channel' })} items={state.stats[key]} />
  //               : null
  //           }
  //           {
  //             key === 'sharerPortion' ? <VisitsBySharerChart title={intl.formatMessage({ id: 'visit_sharer' })} items={state.stats[key]} />
  //               : null
  //           }
  //         </ListItem>
  //       )}
  //     />
  //   </StatsWrapper>
  // );
}

export default VisitStats
