import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import moment from 'moment'
import { useIntl } from 'react-intl'
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
import { OP_GTE } from '../../Helpers/ServiceHelper'
import ItemVisitService from '../../Services/ItemVisitService';
import message from '../Form/message';
import IUser from '../../Types/User/IUser';
import IItemVisit from '../../Types/Article/IItemVisit';
import Utils from '../../Services/Utils'

// Every breakpoint needs a count: antd leaves items as wide as their content where one is missing.
export const VISIT_STATS_GRID = { gutter: listGutter, xs: 1, sm: 1, md: 1, lg: 3, xl: 3, xxl: 3, xxxl: 3 }

const StatsWrapper = styled.div``

type iStatsSum = {
  channelPortion: {[key: string]: number};
  visitTrend: {[key: string]: number};
  sharerPortion: {[key: string]: {sharer: IUser, total: number}};
}
type iState = {
  initLoading: boolean
  recentDays: 10,
  itemVisits?: IItemVisit[];
}
const initialState: iState = {
  initLoading: false,
  recentDays: 10,
}

const VisitStats = ({ article }: { article?: IArticle }) => {
  const [state, setState] = useState(initialState);
  const intl = useIntl();
  /**
   * getting all stats for an company
   */
  useEffect(() => {
    setState((s) => ({ ...s, initLoading: true }));
    let isCancelled = false;
    ItemVisitService.getAll({
        where: JSON.stringify({
          createdAt: {[OP_GTE]: moment().subtract(state.recentDays, 'day').toDate()},
          isActive: true,
          ...(article ? {itemId: article.id} : {})
        }),
        include: 'SharedBy',
        perPage: 99999999999,
      })
      .then((res) => {
        if (isCancelled === true) return;
        setState((s) => ({
          ...s,
          itemVisits: res.data,
        }));
      })
      .catch(err => {
        if (isCancelled === true) return;
        message.error(Utils.getErrorMessage(err))
      })
      .finally(() => {
        if (isCancelled === true) return;
        setState((s) => ({
          ...s,
          initLoading: false,
        }));
      })
    return () => { // eslint-disable-line
      isCancelled = true;
    };
  }, [article, state.recentDays]);

  /**
   *
   * @param days
   */
  const formatRecentDays = (days: number) => {
    if (days >= 365) {
      return intl.formatMessage({ id: 'latest_year' }, { number: '1' });
    }
    if (days >= 30) {
      return intl.formatMessage({ id: 'latest_month' }, { number: '1' });
    }
    if (days <= 1) {
      return intl.formatMessage({ id: 'latest_day' }, { number: '1' });
    }
    return intl.formatMessage({ id: 'latest_day' }, { number: days });
  };
  /**
   *
   * @param e
   */
  const changeDays = (item: any) => { // eslint-disable-line
    setState({
      ...state,
      recentDays: item.key,
    });
  };

  /**
   *
   */
  return (
    <StatsWrapper>
      <Row>
        <Col flex="auto">
          <BoxTitleDiv>{intl.formatMessage({ id: 'visit_stats' })}:
            <BoxTitleSuffix>{moment().subtract(state.recentDays, 'days').format('ll')}</BoxTitleSuffix>
          </BoxTitleDiv>
        </Col>
        <Col flex="180px">
          <div style={{ textAlign: 'right' }}>
            <Dropdown menu={{
              items: [1, 7, 14, 30, 365].map((days) => ({ key: days, label: formatRecentDays(days)})),
              onClick: changeDays,
            }}>
              <Button type={'text'}>
                {formatRecentDays(state.recentDays)} <Icons.DownOutlined />
              </Button>
            </Dropdown>
          </div>
        </Col>
      </Row>
      <List
        className="visit-stats-list"
        loading={state.initLoading}
        grid={VISIT_STATS_GRID}
        dataSource={['channelPortion', 'visitTrend', 'sharerPortion']}
        renderItem={(key: string) => (
          <ListItem>
            {
              key === 'channelPortion' ? <VisitsByChannelChart title={intl.formatMessage({ id: 'visit_channel' })} itemVisits={state.itemVisits || []} />
                : null
            }
            {
              key === 'visitTrend' ? <VisitsByChannelLineChart itemsOverDays={state.recentDays} title={intl.formatMessage({ id: 'trend_channel' })} itemVisits={state.itemVisits || []} />
                : null
            }
            {
              key === 'sharerPortion' ? <VisitsBySharerChart title={intl.formatMessage({ id: 'visit_sharer' })} itemVisits={state.itemVisits || []} />
                : null
            }
          </ListItem>
        )}
      />
    </StatsWrapper>
  );
}

export default VisitStats
