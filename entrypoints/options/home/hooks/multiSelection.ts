import { useContext, useState, useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { throttle } from 'lodash-es';
import { GroupItem } from '~/entrypoints/types';
import { checkIsIntersecting } from '~/entrypoints/common/hooks/selectionBox';
import { HomeContext } from './treeData';

// 框选样式组件
export const StyledSelectionBox = styled.div`
  position: absolute;
  border: 1px dashed ${(props) => props.theme.colorPrimary || '#1890ff'};
  background-color: rgba(24, 144, 255, 0.1);
  z-index: 10;
  pointer-events: none;
`;

export default function useTabsSelection({
  groupData,
  container,
  selectedTabIds,
  setSelectedTabIds,
  onMouseDown,
}: {
  groupData: Partial<GroupItem>;
  container: HTMLElement;
  selectedTabIds: string[];
  setSelectedTabIds: React.Dispatch<React.SetStateAction<string[]>>;
  onMouseDown?: () => void;
}) {
  const { selectionBoxHook } = useContext(HomeContext);
  const { isSelectMoving, selectionBoxData, actionType } = selectionBoxHook;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isSelectMoving) {
      setSelectedIds(selectedTabIds);
    }
  }, [selectedTabIds, isSelectMoving]);

  // 检查标签项是否与选择框相交
  const checkSelection = useCallback(() => {
    if (groupData.isLocked || !isSelectMoving || !container) return;

    const tabItems = container.querySelectorAll('.tab-list-item');
    const newSelectedIds: string[] = [...selectedIds];

    let hasChanged = false;

    for (let item of tabItems) {
      const { left, top, width, height } = item.getBoundingClientRect();

      // 检查是否与选择框相交
      const isIntersecting =
        selectionBoxData.left < left + width &&
        selectionBoxData.left + selectionBoxData.width > left &&
        selectionBoxData.top < top + height &&
        selectionBoxData.top + selectionBoxData.height > top;

      // 获取标签ID
      const tabId = item.getAttribute('data-id');
      if (!tabId) continue;

      if (isIntersecting) {
        if (!newSelectedIds.includes(tabId)) {
          hasChanged = true;
          newSelectedIds.push(tabId);
        } else {
          if (actionType === 'meta') {
            hasChanged = true;
            newSelectedIds.splice(newSelectedIds.indexOf(tabId), 1);
          }
        }
      } else {
        if (actionType === 'default' && newSelectedIds.includes(tabId)) {
          hasChanged = true;
          // 如果不相交且已选中，则从选中列表中移除
          newSelectedIds.splice(newSelectedIds.indexOf(tabId), 1);
        }
      }
    }

    if (!hasChanged) return;
    // 只有当选中状态有变化时才更新
    setSelectedTabIds(newSelectedIds);
  }, [
    groupData.isLocked,
    isSelectMoving,
    actionType,
    container,
    selectionBoxData,
    setSelectedTabIds,
  ]);

  // 使用节流函数包装checkSelection，减少调用频率
  const checkSelectionThrottle = useMemo(
    () => throttle(checkSelection, 10, { leading: true, trailing: true }),
    [checkSelection]
  );

  useEffect(() => {
    // 只有在选择过程中才检查相交
    if (!isSelectMoving) return;

    // 首先检查选择框是否与容器相交，避免不必要的计算
    const _isIntersecting = checkIsIntersecting(selectionBoxData, container);

    if (_isIntersecting) {
      // 使用节流函数减少调用频率
      checkSelectionThrottle();
    }

    // 组件卸载时取消未执行的节流函数
    return () => {
      checkSelectionThrottle.cancel();
    };
  }, [isSelectMoving, selectionBoxData, container, checkSelectionThrottle]);

  return {
    checkSelection,
  };
}
