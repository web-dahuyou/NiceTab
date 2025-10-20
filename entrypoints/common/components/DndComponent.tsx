import { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
  attachClosestEdge,
  Edge,
  extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { eventEmitter, useIntlUtls } from '~/entrypoints/common/hooks/global';
import { classNames } from '~/entrypoints/common/utils';
import { ENUM_COLORS } from '~/entrypoints/common/constants';

const StyledDndWrapper = styled.div`
  position: relative;
  opacity: 1;
  // --ds-border-selected: ${props => props.theme.colorBgContainer};
  // transition: all 0.15s ease-in-out;

  &.dragging {
    opacity: 0.4;
  }
`;

const StyledPreviewBox = styled.div`
  padding: 6px 12px;
  border-radius: 6px;
  // background: ${props => props.theme.colorBgElevated};
  // background: ${ENUM_COLORS.purple};
  background: ${props => props.theme.colorPrimary};
  pointer-events: none;
  color: #fff;
`;

export type DraggableStateType = 'idle' | 'preview' | 'dragging';

export type DraggableStateItem =
  | { type: 'idle' }
  | { type: 'preview'; container: HTMLElement }
  | { type: 'dragging' };

// 拖拽数据类型
export type DragData = Record<string | symbol, any> & {
  index: number;
  dndKey?: symbol;
  groupId?: string;
  selectedValues?: string[];
  isDragging?: boolean;
  draggableState?: DraggableStateItem;
};

type OnDropCallback<T extends DragData> = ({
  sourceData,
  targetData,
  sourceIndex,
  targetIndex,
}: {
  sourceData: T;
  targetData: T;
  sourceIndex: number;
  targetIndex: number;
}) => void;

export type OnSourceDropCallback<T extends DragData> = ({
  sourceData,
  targetData,
}: {
  sourceData: T;
  targetData: T;
}) => void;

export const idleState: DraggableStateItem = { type: 'idle' };
export const draggingState: DraggableStateItem = { type: 'dragging' };

export default function DndComponent<IncomeData extends DragData>({
  dndKey,
  canDrag,
  data,
  mainField, // 区分拖拽元素的唯一标识字段
  onDragStateChange,
  onDrop, // 目标drop元素会触发
  onSourceDrop, // drag的元素会触发
  children,
}: {
  dndKey: symbol;
  canDrag: boolean;
  data: IncomeData;
  mainField: keyof IncomeData;
  onDragStateChange?: (state: DraggableStateItem, data: IncomeData) => void;
  onDrop?: OnDropCallback<IncomeData>;
  onSourceDrop?: OnSourceDropCallback<IncomeData>;
  children: JSX.Element;
}) {
  const { $fmt } = useIntlUtls();
  const ref = useRef<HTMLDivElement | null>(null);
  const [draggableState, setDraggableState] = useState<DraggableStateItem>(idleState);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  // 拖拽的元素是否选中状态
  const isDragItemSelected = useMemo(() => {
    return data.selectedValues?.includes(data[mainField]);
  }, [data, mainField]);

  // 是否协同拖拽状态（比如选中了a,b,c三个元素，那么拖拽a,b,c中任意一个，其他几个元素也认为是拖拽状态）
  const isMultiSelect = useMemo(() => {
    return isDragItemSelected ? (data.selectedValues || []).length > 1 : false;
  }, [data]);

  // 拖拽状态变化
  const handleDragStateChange = useCallback(
    (value: DraggableStateItem) => {
      onDragStateChange?.(value, data);
      setDraggableState(value);
    },
    [data, onDragStateChange, setDraggableState],
  );

  const getDragData = useCallback(() => {
    return {
      ...data,
      // 多选拖拽时标记为多选操作
      isMultiSelect,
    };
  }, [data, isMultiSelect]);

  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;
    const keyData: IncomeData = { ...data, [dndKey]: true };

    return combine(
      draggable({
        element,
        canDrag() {
          return canDrag;
        },
        getInitialData(): IncomeData {
          return getDragData();
        },
        onGenerateDragPreview({ nativeSetDragImage }) {
          if (!isMultiSelect || !isDragItemSelected) {
            return () => handleDragStateChange(draggingState);
          }
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: pointerOutsideOfPreview({
              x: '16px',
              y: '8px',
            }),
            render({ container }) {
              handleDragStateChange({ type: 'preview', container });

              return () => handleDragStateChange(draggingState);
            },
          });
        },
        onDragStart() {
          // console.log('--------------draggable--onDragStart', data);

          // setIsDragging(true);
          handleDragStateChange(draggingState);
          eventEmitter.emit('home:is-dragging', true);
        },
        onDrop({ location, source }) {
          // console.log('--------------draggable--onDrop');
          // setIsDragging(false);
          handleDragStateChange(idleState);
          const target = location.current.dropTargets[0];

          if (source && target) {
            onSourceDrop?.({
              sourceData: source?.data as IncomeData,
              targetData: target?.data as IncomeData,
            });
          }
          eventEmitter.emit('home:is-dragging', false);
        },
      }),
      dropTargetForElements({
        element,
        getData({ input }) {
          // console.log('dropTargetForElements-getData--input', input);
          return attachClosestEdge(keyData, {
            element,
            input,
            allowedEdges: ['top', 'bottom'],
          });
        },
        canDrop({ source }) {
          // console.log('dropTargetForElements-canDrop', source);
          return source?.data?.dndKey === dndKey;
        },
        onDrag({ self, source }) {
          const isSource = source.element === element;
          if (isSource) {
            setClosestEdge(null);
            return;
          }

          const closestEdge = extractClosestEdge(self?.data);
          // console.log('dropTargetForElements--self', self.data)
          // console.log('dropTargetForElements--source', source.data)
          // console.log('dropTargetForElements--closestEdge', closestEdge)
          const sourceIndex = +(source?.data?.index || 0);

          const isItemBeforeSource = data.index === sourceIndex - 1;
          const isItemAfterSource = data.index === sourceIndex + 1;
          // 跨组拖拽不需要隐藏indicator
          const isDropIndicatorHidden =
            data.groupId &&
            data.groupId === source?.data?.groupId &&
            ((isItemBeforeSource && closestEdge === 'bottom') ||
              (isItemAfterSource && closestEdge === 'top'));

          if (isDropIndicatorHidden) {
            setClosestEdge(null);
            return;
          }

          if (self?.data?.isEmpty) {
            setClosestEdge('top');
            return;
          }

          setClosestEdge(closestEdge);
        },
        onDragLeave() {
          setTimeout(() => {
            setClosestEdge(null);
          }, 30);
        },
        onDrop({ location, source }) {
          // console.log('dropTargetForElements--onDrop');
          setClosestEdge(null);

          const target = location.current.dropTargets[0];
          if (!source || !target) {
            return;
          }
          // console.log('dropTargetForElements--location', location);
          // console.log('dropTargetForElements--source', source.data);
          // console.log('dropTargetForElements--target', target.data);

          const sourceData = source.data as IncomeData;
          const targetData = target.data as IncomeData;

          const closestEdgeOfTarget = extractClosestEdge(targetData);
          // console.log('dropTargetForElements--closestEdgeOfTarget', closestEdgeOfTarget);
          const sourceIndex = +(sourceData?.index || 0);
          const targetIndex =
            +(targetData?.index || 0) + (closestEdgeOfTarget === 'top' ? 0 : 1);
          if (targetIndex < 0) {
            return;
          }
          // console.log('dropTargetForElements--sourceIndex', sourceIndex);
          // console.log('dropTargetForElements--targetIndex', targetIndex);

          onDrop && onDrop({ sourceData, targetData, sourceIndex, targetIndex });
        },
      }),
    );
  }, [data, dndKey, isMultiSelect, handleDragStateChange]);

  return (
    <StyledDndWrapper
      ref={ref}
      className={classNames(draggableState.type, data.isDragging && draggingState.type)}
    >
      {children}
      {closestEdge && <DropIndicator edge={closestEdge} gap="0px" />}
      {(data?.selectedValues || [])?.length > 1 &&
        draggableState.type === 'preview' &&
        ReactDOM.createPortal(
          <StyledPreviewBox>
            {$fmt({
              id: 'home.tab.selectedCount',
              values: { count: data?.selectedValues?.length || 0 },
            })}
          </StyledPreviewBox>,
          draggableState.container,
        )}
    </StyledDndWrapper>
  );
}
