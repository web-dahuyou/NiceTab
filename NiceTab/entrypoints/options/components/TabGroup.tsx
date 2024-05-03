import React, { useEffect, useRef } from 'react';
import { theme } from 'antd';
import { LockOutlined, StarOutlined, CloseOutlined } from '@ant-design/icons';
import { GroupItem, TabItem } from '~/entrypoints/types';
import { classNames } from '~/entrypoints/common/utils';
import { tabListUtils } from '~/entrypoints/common/storage';
import { openNewTab } from '~/entrypoints/common/tabs';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { ENUM_COLORS } from '~/entrypoints/common/constants';
import EditInput from './EditInput';
import {
  StyledGroupWrapper,
  StyledGroupHeader,
  StyledTabListWrapper,
  StyledTabTitle,
  StyledTabItemFavicon,
} from './TabGroup.styled';

const { useToken } = theme;

type TabGroupProps = GroupItem & {
  selected?: boolean;
  onChange?: (data: Partial<GroupItem>) => void;
  onRemove: () => void;
  onRestore: () => void;
  onStarredChange?: (isStarred: boolean) => void;
}

export default function TabGroup(
  {
    groupId,
    groupName,
    createTime,
    tabList,
    isLocked,
    isStarred,
    selected,
    onChange,
    onRemove,
    onRestore,
    onStarredChange
  }: TabGroupProps
) {
  const { token } = useToken();
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && groupRef.current) {
      groupRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selected]);

  return (
    <StyledGroupWrapper
      className="tab-group-wrapper"
      data-gid={groupId}
      $bgColor={selected ? token.colorPrimaryBg : ''}
      ref={groupRef}
    >
      <StyledGroupHeader className="group-header">
        { !isLocked && (
          <StyledActionIconBtn
            className="btn-remove"
            $size="16"
            $hoverColor={token.colorPrimaryHover}
            onClick={() => onRemove?.()}
          >
            <CloseOutlined />
          </StyledActionIconBtn>
        ) }

        <div className="group-status-wrapper">
          { isLocked && (
            <StyledActionIconBtn $size="16" $hoverColor={token.colorPrimaryHover} onClick={() => onChange?.({ isLocked: !isLocked })}>
              <LockOutlined />
            </StyledActionIconBtn>
          ) }
          { isStarred && (
            <StyledActionIconBtn $size="16" $hoverColor={token.colorPrimaryHover} onClick={() => onStarredChange?.(!isStarred)}>
              <StarOutlined />
            </StyledActionIconBtn>
          )}
        </div>

        <div className="group-name-wrapper">
          <EditInput
            value={groupName || '未命名'}
            onValueChange={(value) => onChange?.({ groupName: value })}
          ></EditInput>
        </div>
        <div className="group-header-right-part">
          <div className="group-create-time">{createTime}</div>
          <div className="group-action-btns">
            { !isLocked && <span className="action-btn" onClick={() => onRemove?.()}>删除该组</span> }
            <span className="action-btn" onClick={() => onRestore?.()}>恢复该组</span>
            <span className="action-btn" onClick={() => onChange?.({ isLocked: !isLocked })}>{ isLocked ? '取消锁定' : '锁定该组'}</span>
            <span className="action-btn" onClick={() => onStarredChange?.(!isStarred)}>{ isStarred ? '取消星标' : '星标该组' }</span>
          </div>
        </div>
      </StyledGroupHeader>

      <StyledTabListWrapper className="tab-list-wrapper">
        {tabList.map((tab, index) => (
          <li className="tab-list-item" key={tab.url}>
            <StyledActionIconBtn
              className="tab-item-btn btn-remove"
              $size="16"
              $hoverColor={ENUM_COLORS.red.primary}
              onClick={() =>
                onChange?.({ tabList: tabList.filter((t, i) => i !== index) })
              }
            >
              <CloseOutlined />
            </StyledActionIconBtn>
            {tab.favIconUrl && (
              <StyledTabItemFavicon
                className="tab-item-favicon"
                $bgUrl={tab.favIconUrl}
              />
            )}
            <StyledTabTitle>
              <span className="tab-title" onClick={() => openNewTab(tab)}>
                {tab.title}
              </span>
            </StyledTabTitle>
          </li>
        ))}
      </StyledTabListWrapper>
    </StyledGroupWrapper>
  );
}
