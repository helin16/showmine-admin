import React from 'react';
import {
  PartitionOutlined, UsergroupAddOutlined,
  PieChartOutlined, ClockCircleOutlined, AuditOutlined,
} from '@ant-design/icons';
import { IPackageItem, PACKAGE_ITEM_TYPES } from '../Types/Package/IPackage';
import AssetService from './AssetService';
import translate from '../i18n/translate';

const getPackageItemIcon = (item: IPackageItem) => {
  if (item.name === PACKAGE_ITEM_TYPES.TIME) {
    return <ClockCircleOutlined />;
  }
  if (item.name === PACKAGE_ITEM_TYPES.CHANNEL) {
    return <PartitionOutlined />;
  }
  if (item.name === PACKAGE_ITEM_TYPES.USER) {
    return <UsergroupAddOutlined />;
  }
  if (item.name === PACKAGE_ITEM_TYPES.STORAGE) {
    return <PieChartOutlined />;
  }
  if (item.name === PACKAGE_ITEM_TYPES.ITEM) {
    return <AuditOutlined />;
  }
  return null;
};

const getPackageItemName = (item: IPackageItem) => {
  if (item.name === PACKAGE_ITEM_TYPES.TIME) {
    return translate('content-life-time');
  }
  if (item.name === PACKAGE_ITEM_TYPES.CHANNEL) {
    return translate('total-channel');
  }
  if (item.name === PACKAGE_ITEM_TYPES.USER) {
    return translate('total-team-member');
  }
  if (item.name === PACKAGE_ITEM_TYPES.STORAGE) {
    return translate('total-storage');
  }
  if (item.name === PACKAGE_ITEM_TYPES.ITEM) {
    return translate('total-content');
  }
  return null;
};

const getPackageItemDescription = (item: IPackageItem) => {
  if (item.name === PACKAGE_ITEM_TYPES.TIME) {
    return translate('hold-content');
  }
  if (item.name === PACKAGE_ITEM_TYPES.CHANNEL) {
    return translate('channel-connect');
  }
  if (item.name === PACKAGE_ITEM_TYPES.USER) {
    return translate('total-team-member');
  }
  if (item.name === PACKAGE_ITEM_TYPES.STORAGE) {
    return translate('total-storage');
  }
  if (item.name === PACKAGE_ITEM_TYPES.ITEM) {
    return translate('total-content');
  }
  return null;
};

const getPackageItemLimit = (item: IPackageItem) => {
  if (item.name === PACKAGE_ITEM_TYPES.TIME) {
    return item.limit < 0 ? translate('unlimited') : item.limit;
  }
  if (item.name === PACKAGE_ITEM_TYPES.CHANNEL) {
    return item.limit < 0 ? translate('unlimited') : item.limit;
  }
  if (item.name === PACKAGE_ITEM_TYPES.USER) {
    return item.limit < 0 ? translate('unlimited') : item.limit;
  }
  if (item.name === PACKAGE_ITEM_TYPES.STORAGE) {
    return AssetService.formatFileSize(item.limit, 0);
  }
  if (item.name === PACKAGE_ITEM_TYPES.ITEM) {
    return item.limit < 0 ? translate('unlimited') : item.limit;
  }
  return null;
};

const PackageService = {
  getPackageItemLimit,
  getPackageItemDescription,
  getPackageItemName,
  getPackageItemIcon,
}

export default PackageService
