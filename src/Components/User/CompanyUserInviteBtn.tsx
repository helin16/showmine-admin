import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import ICompany from '../../Types/Company/ICompany';
import CompanyService from '../../Services/CompanyService';
import { RootState } from '../../Redux/makeReduxStore';
import {PACKAGE_ITEM_TYPES} from '../../Types/Package/IPackage';
import message from '../Form/message';
import Button from '../Form/Button';
import Icons from '../Icons';
import Modal from '../Form/Modal';
import Typography from '../Form/Typography';
import Spin from '../Form/Spin';
import Image from '../Form/Image';

const initialState = {
  showingInvitationPanel: false,
  loading: false,
  qrCodeUrl: '',
};

const CompanyUserInviteBtn = ({ company }: {company?: ICompany | null}) => {
  const [state, setState] = useState(initialState);
  const { companyPackage } = useSelector(
    (s: RootState) => s.auth,
  );

  const showInvitationPanel = () => {
    if (!company || company === null || !company.id) return;
    setState({
      ...state,
      showingInvitationPanel: true,
      loading: true,
    });
    CompanyService.getInviteCompanyUserQrCode(company.id)
      .then((res) => {
        setState({
          ...state,
          showingInvitationPanel: true,
          qrCodeUrl: res.data.url,
        });
      })
      .catch((err) => {
        message.error(`Error Occurred when getting the invite url: ${err.response.data.message}.`);
      });
  };

  const isPackageValid = () => {
    if (!company || company === null) return false;
    if (!companyPackage || companyPackage === null) return false;
    if (!companyPackage.validate_result) return false;
    if (companyPackage.validate_result[PACKAGE_ITEM_TYPES.USER].is_valid !== true) return false;
    return true;
  };
  return (
    <div>
      {(isPackageValid() !== true) ? null : (
        <Button
          type='primary'
          icon={<Icons.PlusOutlined />}
          onClick={showInvitationPanel}>
          Invite User
        </Button>
      )}
      <Modal
        centered
        destroyOnClose
        title={<h3>{'Invite more user:'}</h3>}
        open={state.showingInvitationPanel}
        footer={null}
        onCancel={() => setState({ ...state, showingInvitationPanel: false })}
      >
        <p>
          Please share the blow QRCode to your staff and ask them to scan this QRCode in WeChat mobile app,
          then they will become <Typography.Text type="warning">pending</Typography.Text> staff for you to approve.
        </p>
        <Spin spinning={state.loading === true}>
          <Image
            src={state.qrCodeUrl}
          />
        </Spin>
      </Modal>
    </div>
  );
};


export default CompanyUserInviteBtn;
