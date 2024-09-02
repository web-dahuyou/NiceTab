import { useCallback, useEffect, useRef, useState } from 'react';
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
import { PRIMARY_COLOR } from '~/entrypoints/common/constants';
import { eventEmitter } from '~/entrypoints/common/hooks/global';

const StyledDndWrapper = styled.div`
  position: relative;
  opacity: 1;
  --ds-border-selected: ${PRIMARY_COLOR};
  &.dragging {
    opacity: 0.4;
  }
`;

// 拖拽数据类型
type DragData = Record<string | symbol, any> & {
  index: number;
  dndKey?: symbol;
  groupId?: string;
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

export default function DndComponent<IncomeData extends DragData>({
  dndKey,
  canDrag,
  data,
  onDrop,
  children,
}: {
  dndKey: symbol;
  canDrag: boolean;
  data: IncomeData;
  onDrop?: OnDropCallback<IncomeData>;
  children: JSX.Element;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  const getDragData = useCallback(() => {
    return { ...data };
  }, [data]);

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
        onDragStart() {
          // console.log('--------------draggable--onDragStart');
          setIsDragging(true);
          eventEmitter.emit('is-dragging', true);
        },
        onDrop() {
          // console.log('--------------draggable--onDrop');
          setIsDragging(false);
          eventEmitter.emit('is-dragging', false);
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

          const closestEdge = extractClosestEdge(self.data);
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
          if (!target) {
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
      })
    );
  }, [data, dndKey]);

  return (
    <StyledDndWrapper ref={ref} className={isDragging ? 'dragging' : ''}>
      {children}
      {closestEdge && <DropIndicator edge={closestEdge} gap="0px" />}
    </StyledDndWrapper>
  );
}
