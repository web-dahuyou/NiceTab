import { useCallback, useState } from 'react';
import { theme, Checkbox, Typography, Tooltip, Popover, QRCode } from 'antd';
import { CloseOutlined, EditOutlined, QrcodeOutlined } from '@ant-design/icons';
import { GroupItem, TabItem } from '~/entrypoints/types';
import { getFaviconURL } from '~/entrypoints/common/utils';
import clickDecorator from '~/entrypoints/common/utils/click';
import { openNewTab } from '~/entrypoints/common/tabs';
import { settingsUtils } from '~/entrypoints/common/storage';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { ENUM_COLORS, ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { eventEmitter, useIntlUtls } from '~/entrypoints/common/hooks/global';
import {
  StyledTabItemWrapper,
  StyledTabTitle,
  StyledTabItemFavicon,
  StyledTabItemTooltip,
} from './TabListItem.styled';
import TabItemEditModal from './TabItemEditModal';

type TabItemProps = {
  group: Pick<GroupItem, 'groupId' | 'isLocked' | 'isStarred'>;
  tab: TabItem;
  onRemove?: () => void;
  onChange?: (data: TabItem) => void;
};

const { DELETE_AFTER_RESTORE } = ENUM_SETTINGS_PROPS;

// 标签页tooltip内容
function TabItemTooltipMarkup({ tab }: { tab: TabItem }) {
  const { $fmt } = useIntlUtls();
  return (
    <StyledTabItemTooltip>
      <div className="tooltip-item tooltip-title">
        <span className="label">{$fmt('common.name')}:</span>
        <span className="name" title={tab.title}>
          {tab.title}
        </span>
      </div>
      <div className="tooltip-item tooltip-url">
        <span className="label">{$fmt('common.url')}:</span>
        {/* <span className="link" title={tab.url}>
          {tab.url}
        </span> */}
        <Typography.Link className="link" href={tab.url} target="_blank" title={tab.url}>
          {tab.url}
        </Typography.Link>
      </div>
    </StyledTabItemTooltip>
  );
}

export default function TabListItem({ tab, group, onRemove, onChange }: TabItemProps) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const [modalVisible, setModalVisible] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // 确认编辑
  const handleModalConfirm = useCallback(
    (newData: TabItem) => {
      onChange?.(newData);
      setModalVisible(false);
    },
    [tab, onChange]
  );

  // 点击打开标签页
  const onTabOpen = clickDecorator(
    ({ isMatched }) => {
      const settings = settingsUtils.settings;
      // 如果直接单击未按下alt键，则打开新标签页并激活(active: true)，如果按下了alt键，则后台静默打开新标签页(active: false)
      openNewTab(tab.url, { active: !isMatched });

      if (settings[DELETE_AFTER_RESTORE]) {
        onRemove?.();
      }

      setTimeout(() => {
        setTooltipVisible(false);
      }, 500);
    },
    { allowMissMatch: true, alt: true }
  );

  const draggingListener = (value: boolean) => {
    setIsDragging(value);
    if (value) setTooltipVisible(false);
  };

  useEffect(() => {
    eventEmitter.on('is-dragging', draggingListener);
    return () => {
      eventEmitter.off('is-dragging', draggingListener);
    };
  }, []);

  return (
    <>
      <StyledTabItemWrapper className="tab-list-item">
        {/* checkbox */}
        {!group?.isLocked && (
          <Checkbox className="checkbox-item" value={tab.tabId}></Checkbox>
        )}
        {/* icon tab qrcode */}
        {tab.url && (
          <Popover
            color="#fbfbfb"
            destroyTooltipOnHide
            content={<QRCode value={tab.url} color="#000" bordered={false} />}
          >
            <StyledActionIconBtn
              className="tab-item-btn btn-qrcode"
              $size="16"
              title={$fmt('common.qrcode')}
              $hoverColor={token.colorPrimary}
            >
              <QrcodeOutlined />
            </StyledActionIconBtn>
          </Popover>
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
            $hoverColor={ENUM_COLORS.red}
            onClick={onRemove}
          >
            <CloseOutlined />
          </StyledActionIconBtn>
        )}
        {/* icon tab favicon */}
        <StyledTabItemFavicon
          className="tab-item-favicon"
          $bgUrl={tab.favIconUrl || getFaviconURL(tab.url!)}
        />
        {/* tab title */}
        <StyledTabTitle
          className="tab-item-title"
          $color={token.colorLink}
          $colorHover={token.colorLinkHover}
        >
          <Tooltip
            open={!isDragging && tooltipVisible}
            placement="topLeft"
            overlayStyle={{ maxWidth: '360px', width: '360px' }}
            title={<TabItemTooltipMarkup tab={tab} />}
            color={token.colorBgElevated}
            destroyTooltipOnHide
            mouseEnterDelay={0.4}
            mouseLeaveDelay={0.3}
            onOpenChange={setTooltipVisible}
          >
            <span className="tab-item-title-text" onClick={onTabOpen}>
              {tab.title}
            </span>
          </Tooltip>
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
