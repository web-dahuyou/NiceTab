import { useCallback, useState } from 'react';
import { theme, Checkbox } from 'antd';
import { CloseOutlined, EditOutlined } from '@ant-design/icons';
import { GroupItem, TabItem } from '~/entrypoints/types';
import { openNewTab } from '~/entrypoints/common/tabs';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { ENUM_COLORS } from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import {
  StyledTabItemWrapper,
  StyledTabTitle,
  StyledTabItemFavicon,
} from './TabListItem.styled';
import TabItemEditModal from './TabItemEditModal';

type TabItemProps = {
  group: Pick<GroupItem, 'groupId' | 'isLocked' | 'isStarred'>;
  tab: TabItem;
  onRemove?: () => void;
  onChange?: (data: TabItem) => void;
};

export default function TabListItem({ tab, group, onRemove, onChange }: TabItemProps) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const [modalVisible, setModalVisible] = useState(false);

  // 确认编辑
  const handleModalConfirm = useCallback(
    (newData: TabItem) => {
      onChange?.(newData);
      setModalVisible(false);
    },
    [tab, onChange]
  );

  return (
    <>
      <StyledTabItemWrapper className="tab-list-item">
        {/* checkbox */}
        {!group?.isLocked && (
          <Checkbox className="checkbox-item" value={tab.tabId}></Checkbox>
        )}
        {/* icon tab edit */}
        <StyledActionIconBtn
          className="tab-item-btn btn-edit"
          $size="16"
          title={$fmt('common.edit')}
          $hoverColor={token.colorPrimary}
          onClick={() => setModalVisible(true)}
        >
          <EditOutlined />
        </StyledActionIconBtn>
        {/* icon tab remove */}
        {!group?.isLocked && (
          <StyledActionIconBtn
            className="tab-item-btn btn-remove"
            $size="16"
            title={$fmt('common.remove')}
            $hoverColor={ENUM_COLORS.red.primary}
            onClick={onRemove}
          >
            <CloseOutlined />
          </StyledActionIconBtn>
        )}
        {/* icon tab favicon */}
        {tab.favIconUrl && (
          <StyledTabItemFavicon className="tab-item-favicon" $bgUrl={tab.favIconUrl} />
        )}
        {/* tab title */}
        <StyledTabTitle
          className="tab-item-title"
          $color={token.colorLink}
          $colorHover={token.colorLinkHover}
        >
          <span
            className="tab-item-title-text"
            title={tab.title}
            onClick={() => openNewTab(tab.url)}
          >
            {tab.title}
          </span>
        </StyledTabTitle>
      </StyledTabItemWrapper>

      {modalVisible && (
        <TabItemEditModal
          data={tab}
          visible={modalVisible}
          onOk={handleModalConfirm}
          onCancel={() => setModalVisible(false)}
        />
      )}
    </>
  );
}
