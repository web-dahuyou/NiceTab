import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

import { tabTarget, type OpenMode } from '~/entrypoints/common/openUtils';
import {
  openModeItems,
  useOpenSavedTabs,
} from '~/entrypoints/common/components/OpenModeMenu';
import type { TabItem } from '~/entrypoints/types';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import Favicon from '~/entrypoints/common/components/Favicon';

import { StyledTabCard, StyledTabCardTitle } from './TabListItem.styled';

export default function TabListItem({
  tab,
  groupId,
  onDelete,
  onEdit,
}: {
  tab: TabItem;
  groupId: string;
  onDelete: (gid: string, tab: TabItem) => void;
  onEdit: (tab: TabItem) => void;
}) {
  const { $fmt } = useIntlUtls();
  const displayTitle = tab.title || tab.url || 'Untitled';

  const openSaved = useOpenSavedTabs();
  const open = (mode: OpenMode = 'current') =>
    openSaved([tabTarget(tab, { active: true, openToNext: mode === 'current' })], mode);
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    open();
  };

  const actionItems: MenuProps['items'] = [
    ...openModeItems($fmt, open),
    {
      key: 'edit',
      label: $fmt('common.edit'),
      icon: <EditOutlined />,
      onClick: e => {
        e?.domEvent?.stopPropagation();
        onEdit(tab);
      },
    },
    {
      key: 'delete',
      label: $fmt('common.delete'),
      icon: <DeleteOutlined />,
      danger: true,
      onClick: e => {
        e?.domEvent?.stopPropagation();
        onDelete(groupId, tab);
      },
    },
  ];

  return (
    <StyledTabCard href={tab.url} title={displayTitle} onClick={handleClick}>
      <Dropdown menu={{ items: actionItems }} placement="bottomRight" destroyPopupOnHide>
        <StyledActionIconBtn
          className="tab-card-menu-btn"
          $size={16}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <MoreOutlined />
        </StyledActionIconBtn>
      </Dropdown>

      <div className="tab-card-icon">
        <Favicon pageUrl={tab.url!} favIconUrl={tab.favIconUrl} size={28}></Favicon>
      </div>
      <StyledTabCardTitle $lines={2}>
        <span>{displayTitle}</span>
      </StyledTabCardTitle>
    </StyledTabCard>
  );
}
