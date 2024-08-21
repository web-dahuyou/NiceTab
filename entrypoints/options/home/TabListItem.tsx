import { useCallback, useState } from 'react';
import { theme, Checkbox } from 'antd';
import { CloseOutlined, EditOutlined } from '@ant-design/icons';
import { GroupItem, TabItem } from '~/entrypoints/types';
import { openNewTab } from '~/entrypoints/common/tabs';
import { settingsUtils } from '~/entrypoints/common/storage';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { ENUM_COLORS, ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
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

const { DELETE_AFTER_RESTORE } = ENUM_SETTINGS_PROPS;

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

  // 点击打开标签页
  const onTabOpen = () => {
    const settings = settingsUtils.settings;
    openNewTab(tab.url);

    if (settings[DELETE_AFTER_RESTORE]) {
      onRemove?.();
    }
  };

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
          <span className="tab-item-title-text" title={tab.title} onClick={onTabOpen}>
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
