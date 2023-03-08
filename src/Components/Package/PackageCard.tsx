import React from 'react';
import styled from 'styled-components';
import IPackage from '../../Types/Package/IPackage';
import Utils from '../../Services/Utils';
import PackageService from '../../Services/PackageService';
import translate from '../../i18n/translate';
import Card from '../Form/Card';
import MathHelper from '../../Helpers/MathHelper';
import List, {ListItem, ListItemMeta} from '../Form/List';

const PackageCardWrapper = styled.div`
  .ant-list-item-meta-avatar {
    font-size: 25px;
  }
  .ant-list-item-meta-description {
    font-size: 10px;
  }
  .limit-amount {
    font-size: 18px;
  }
`;
export default ({ planPackage, children }: {planPackage: IPackage, children?: React.ComponentProps<any>}) => { // eslint-disable-line

  return (
    <PackageCardWrapper>
      <Card>
        <h3>{planPackage.name}</h3>
        <h1>{planPackage.price <= 0 ? translate('free') : translate('per-month', { num: Utils.formatCurrency(MathHelper.div(planPackage.price, 100)) })}</h1>
        <div className={'details'}>
          <List
            dataSource={planPackage.package_item_details}
            renderItem={(item) => (
              <ListItem>
                <ListItemMeta
                  avatar={PackageService.getPackageItemIcon(item)}
                  title={PackageService.getPackageItemName(item)}
                  description={PackageService.getPackageItemDescription(item)}
                />
                <div className={'limit-amount'}>{PackageService.getPackageItemLimit(item)}</div>
              </ListItem>
            )}
          />
        </div>
        {children}
      </Card>
    </PackageCardWrapper>
  );
};
