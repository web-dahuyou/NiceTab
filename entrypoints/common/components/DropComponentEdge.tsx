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

const StyledDndWrapper = styled.div`
  position: relative;
  opacity: 1;
  --ds-border-selected: ${PRIMARY_COLOR};
  &.dragging {
    opacity: 0.4;
  }
`;

// 拖拽数据类型
type DropTargetData = Record<string | symbol, any> & {
  index: number;
  allowKeys: Symbol[];
  groupId?: string;
};

type OnDropCallback<T extends DropTargetData> = ({
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

export default function DropComponent<IncomeData extends DropTargetData>({
  data,
  canDrop = true,
  onDrop,
  children,
}: {
  data: IncomeData;
  canDrop?: boolean;
  onDrop?: OnDropCallback<IncomeData>;
  children: JSX.Element;
}) {
  const ref = useRef<HTMLDivElement | null>(null);;
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;

    return combine(
      dropTargetForElements({
        element,
        getData({ input }) {
          // console.log('dropTargetForElements-getData--input', input);
          return attachClosestEdge(data, {
            element,
            input,
            allowedEdges: ['top', 'bottom'],
          });
        },
        canDrop({ source }) {
          return canDrop && data?.allowKeys.includes(source?.data?.dndKey as Symbol);
        },
        onDrag({ self, source }) {
          // console.log('onDrag-allowKeys', data?.allowKeys);
          // console.log('onDrag-self', self);
          // console.log('onDrag-source', source);
          const isSource = source.element === element || source?.data?.groupId === data.groupId;
          if (isSource || !data?.allowKeys?.includes(source?.data?.dndKey as Symbol)) {
            setClosestEdge(null);
            return;
          }

          setClosestEdge('top');
        },
        onDragLeave() {
          setTimeout(() => {
            setClosestEdge(null);
          }, 30);
        },
        onDrop({ location, source }) {
          setClosestEdge(null);

          const target = location.current.dropTargets[0];
          if (!target) {
            return;
          }

          const sourceData = source.data as IncomeData;
          const targetData = target.data as IncomeData;

          const sourceIndex = +(sourceData?.index || 0);

          onDrop && onDrop({ sourceData, targetData, sourceIndex, targetIndex: 0 });
        },
      })
    );
  }, [data]);

  return (
    <StyledDndWrapper ref={ref}>
      {children}
      {closestEdge && <DropIndicator edge={closestEdge} gap="0px" />}
    </StyledDndWrapper>
  );
}
