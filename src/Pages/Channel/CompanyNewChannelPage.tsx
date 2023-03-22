import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useSelector } from 'react-redux'
import IChannel from '../../Types/Channel/IChannel'
import { CHANNEL_TYPES, iChannelType } from '../../Constants'
import { COMPANY_CHANNELS_URL } from '../../UrlMap'
import { RootState } from '../../Redux/makeReduxStore'
import translate from '../../i18n/translate'
import { inlineInputBgColor } from '../../Styles/AppWrapper'
import { useNavigate } from 'react-router-dom'
import ChannelIcon from '../../Components/Channel/ChannelIcon'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import Card from '../../Components/Form/Card'
import Button from '../../Components/Form/Button'
import ChannelEditor from '../../Components/Channel/ChannelEditor'
import List, { ListItem, ListItemMeta } from '../../Components/Form/List'
import Icons from '../../Components/Icons'

const NewChannelWrapper = styled.div`
  .channel-list-item {
    cursor: pointer;
    :hover {
      background: ${inlineInputBgColor};
    }
  }
`

type iState = {
  loading: boolean
  channelList: iChannelType[]
  selectedChannel?: IChannel
}
const initialState: iState = {
  loading: false,
  channelList: [],
}
const CompanyNewChannelPage = () => {
  return null
  // const { company } = useSelector((s: RootState) => s.auth);
  // const [state, setState] = useState(initialState);
  // const navigate = useNavigate();
  //
  // useEffect(() => {
  //   setState((s) => ({
  //     ...s,
  //     loading: false,
  //     channelList: CHANNEL_TYPES,
  //   }));
  // }, []);
  //
  // const selectAChannel = (channel: IChannel) => {
  //   setState({
  //     ...state,
  //     selectedChannel: {
  //       ...channel,
  //       name: '',
  //     },
  //   });
  // };
  //
  // const unSelectAChannel = () => {
  //   setState({
  //     ...state,
  //     selectedChannel: undefined,
  //   });
  // };
  //
  // const handleOnCancel = () => {
  //   navigate(COMPANY_CHANNELS_URL);
  // };
  //
  // const getChannelList = () => (
  //     <List
  //       className="channel-type-list"
  //       loading={state.loading}
  //       itemLayout="horizontal"
  //       dataSource={state.channelList.sort((a: iChannelType, b: iChannelType) => (a.name < b.name ? 0 : 1))}
  //       renderItem={(channelType: iChannelType) => {
  //         const fakeChannel = { ...initialChannel, type: channelType.type, name: channelType.name };
  //         return (
  //           <ListItem
  //             className={'channel-list-item'}
  //             onClick={() => selectAChannel(fakeChannel)}
  //             extra={
  //               <Icons.RightOutlined />
  //             }>
  //
  //             <ListItemMeta
  //               avatar={<ChannelIcon channel={fakeChannel} />}
  //               title={fakeChannel.name}
  //               description={
  //                 <div>{translate('click-connect')}<b>{fakeChannel.name}</b></div>
  //               }
  //             />
  //           </ListItem>
  //         );
  //       }}
  //     />
  // );
  //
  // return (
  //   <BackendPage
  //     selectedMenu={''}
  //     ContentHeader={
  //       <BackendPageContentTitle title={
  //         <div style={{ display: 'flex', alignItems: 'center' }}>
  //           <span>{translate('connect-new')}</span>
  //           {!state.selectedChannel ? null : <ChannelIcon channel={state.selectedChannel} style={{ margin: '0 10px' }}/>}
  //           <span>{translate('channel')}</span>
  //         </div>
  //       }/>
  //     }
  //   >
  //
  //     <Card>
  //       <NewChannelWrapper>
  //         {!state.selectedChannel ? getChannelList() : (
  //           <ChannelEditor
  //             channel={state.selectedChannel}
  //             onSaved={handleOnCancel}
  //             onCancel={unSelectAChannel}
  //             company={(!company || company === null) ? undefined : company }/>
  //         )}
  //       </NewChannelWrapper>
  //     </Card>
  //     {!state.selectedChannel ? (
  //       <div style={{ textAlign: 'right' }}>
  //         <Button type={'link'} onClick={handleOnCancel}>{translate('cancel')}</Button>
  //       </div>
  //     ) : null }
  //   </BackendPage>
  // );
}

export default CompanyNewChannelPage
