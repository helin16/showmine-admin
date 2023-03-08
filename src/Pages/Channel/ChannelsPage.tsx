import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/makeReduxStore';
import { MENU_KEY_COMPANY_CHANNELS } from '../../Components/Menu/MenuItems';
import { COMPANY_CHANNEL_NEW_URL } from '../../UrlMap';
import translate from '../../i18n/translate';
import BackendPage from '../../Layouts/BackendPage';
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle';
import Card from '../../Components/Form/Card';
import Button from '../../Components/Form/Button';
import ChannelList from '../../Components/Channel/ChannelList';
import Icons from '../../Components/Icons';
import {useNavigate} from 'react-router-dom';

const CompanyChannelsPage = () => {
  const { company } = useSelector((s: RootState) => s.auth);
  const navigate = useNavigate();

  return (
    <BackendPage
      selectedMenu={MENU_KEY_COMPANY_CHANNELS}
      ContentHeader={
        <BackendPageContentTitle
          title={translate('channels')}
          controls={
            <Button type={'primary'} icon={<Icons.PlusOutlined />} onClick={() => navigate(COMPANY_CHANNEL_NEW_URL)}>
              {translate('new-channel')}
            </Button>
          }
        />
      }
    >

      {!company ? null : (
        <Card>
          <ChannelList company={company} />
        </Card>
      )}
    </BackendPage>
  );
};


export default CompanyChannelsPage;
