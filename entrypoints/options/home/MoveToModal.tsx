import { useMemo, useState, useEffect } from 'react';
import { theme, Modal, Cascader, Typography } from 'antd';
import styled from 'styled-components';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { tabListUtils } from '~/entrypoints/common/storage';
import type { TagItem } from '~/entrypoints/types';
import type { MoveDataProps, CascaderOption } from './types';
import { getCascaderData } from './utils';

const StyledCascaderWrapper = styled.div`
  .ant-cascader-menu {
    min-height: 180px;
    max-height: 360px;
    overflow: auto;
  }
  .cascader-label-custom {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

interface MoveToModalProps {
  visible: boolean;
  listData?: TagItem[];
  onOk?: () => void;
  onCancel?: () => void;
  moveData?: MoveDataProps
}
export default function MoveToModal({ visible = false, onOk, onCancel, listData, moveData }: MoveToModalProps) {
  const { $fmt } = useIntlUtls();
  const [options, setOptions] = useState<CascaderOption[]>([]);
  const [targetValue, setTargetValue] = useState<string[]>([]);
  const [targetOptions, setTargetOptions] = useState<CascaderOption[]>([]);

  const validInfo = useMemo(() => {
    if (!moveData) return { valid: false, type: 'tag' };
    const { tabs } = moveData || {};
    if (!targetOptions?.length) {
      return { valid: false, type: 'tag' };
    }

    if (!tabs?.length) {
      return { valid: targetOptions?.length > 0, type: 'tag' };
    }

    return { valid: targetOptions?.length > 1, type: 'tabGroup' };
  }, [moveData, targetOptions]);

  const onChange = async (value: string[], selectedOptions: CascaderOption[]) => {
    setTargetValue(value);
    setTargetOptions(selectedOptions);
  };

  const handleMoveTo = async () => {
    if (!moveData) return;
    if (!validInfo.valid) return;
    if (!targetOptions?.length) return;

    if (validInfo.type === 'tag') {
      await tabListUtils.tabGroupMoveThrough(moveData?.groupId, targetOptions[0].value);
    } else {
      const targetTagId = targetOptions[0].value;
      const targetSourceId = targetOptions[1].value;
      const tabs = moveData?.tabs || [];
      await tabListUtils.tabMoveThrough(moveData?.groupId, targetTagId, targetSourceId, tabs);
    }

    setTargetValue([]);
    setTargetOptions([]);
    onOk?.();
  };

  const initData = async () => {
    const tagList = listData || await tabListUtils.getTagList();
    const cascaderData = getCascaderData(tagList, moveData);
    setOptions(cascaderData);
  };

  useEffect(() => {
    initData();
    if (!visible) {
      setTargetOptions([]);
    }
  }, [listData, visible]);

  useEffect(() => {
    initData();
  }, []);

  return (
    <Modal
      title={$fmt('common.moveTo')}
      width={500}
      open={visible}
      onOk={handleMoveTo}
      onCancel={onCancel}
    >
      <StyledCascaderWrapper>
        <Cascader.Panel options={options} value={targetValue} changeOnSelect onChange={onChange}></Cascader.Panel>
        { !validInfo.valid && (
          <div style={{ marginTop: '12px', fontSize: '12px' }}>
            <Typography.Text type="danger">
              {$fmt({
                id: 'home.moveTo.missingTip',
                values: { type: $fmt(`home.${validInfo?.type || 'tag'}`) }
              })}
            </Typography.Text>
          </div>
        ) }
      </StyledCascaderWrapper>
    </Modal>
  );
}
