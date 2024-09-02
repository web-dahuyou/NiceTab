import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
  attachInstruction,
  extractInstruction,
  Instruction,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item';
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/tree-item';
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
  const [instruction, setInstruction] = useState<Instruction | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;

    return combine(
      dropTargetForElements({
        element,
        getData({ input }) {
          // console.log('dropTargetForElements-getData--input', input);
          return attachInstruction(data, {
            input,
            element,
            currentLevel: 0,
            indentPerLevel: 10,
            mode: "expanded",
            block: ['reorder-above', 'reorder-below', 'reparent']
          });
        },
        canDrop({ source }) {
          return canDrop && data?.allowKeys.includes(source?.data?.dndKey as Symbol);
        },
        onDrag({ self, source }) {
          const isSource = source.element === element || source?.data?.groupId === data.groupId;
          if (isSource || !data?.allowKeys?.includes(source?.data?.dndKey as Symbol)) {
            setInstruction(null);
            return;
          }

          const instruction: Instruction | null = extractInstruction(self.data);
          if (instruction?.type === 'make-child') {
            setInstruction(instruction);
          } else {
            setInstruction(null);
          }
        },
        onDragLeave() {
          setTimeout(() => {
            setInstruction(null);
          }, 30);
        },
        onDrop({ location, source }) {
          setInstruction(null);

          const target = location.current.dropTargets[0];
          if (!target) {
            return;
          }

          const sourceData = source.data as IncomeData;
          const targetData = target.data as IncomeData;

          const sourceIndex = +(sourceData?.index || 0);

          onDrop && onDrop({ sourceData, targetData, sourceIndex, targetIndex: data.index || 0 });
        },
      })
    );
  }, [data]);

  return (
    <StyledDndWrapper ref={ref}>
      {children}
      {instruction && <DropIndicator instruction={instruction} />}
    </StyledDndWrapper>
  );
}
