import { useContext, useMemo, useState, useEffect } from 'react';
import { theme, Checkbox, Modal, Cascader, Typography, Flex, Space, Tooltip } from 'antd';
import type { CheckboxProps } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { tabListUtils } from '~/entrypoints/common/storage';
import type { TagItem } from '~/entrypoints/types';
import type { MoveDataProps, MoveTargetProps, CascaderOption } from './types';
import { HomeContext } from './hooks/treeData';
import { getCascaderData } from './utils';

const StyledCascaderWrapper = styled.div`
  .ant-cascader-panel {
    overflow-x: visible;
  }
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
  onOk?: ({ targetTagId, targetGroupId }: MoveTargetProps) => void;
  onCancel?: () => void;
  moveData?: MoveDataProps;
}
export default function MoveToModal({
  visible = false,
  onOk,
  onCancel,
  listData,
  moveData,
}: MoveToModalProps) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const { treeDataHook } = useContext(HomeContext);
  const [options, setOptions] = useState<CascaderOption[]>([]); // 级联数据
  const [targetValue, setTargetValue] = useState<string[]>([]); // 选中的目标值
  const [targetOptions, setTargetOptions] = useState<CascaderOption[]>([]); // 选中的目标选项
  const [autoMerge, setAutoMerge] = useState<boolean>(false); // 是否自动合并

  // 校验级联数据
  const validInfo = useMemo(() => {
    if (!moveData) return { valid: false, type: 'tag' };
    const { tagId, groupId, tabs } = moveData || {};
    if (!targetOptions?.length) {
      return { valid: false, type: 'tag' };
    }

    if (!tagId && !groupId) {
      return { valid: false, type: 'tag' };
    }

    if (tagId || !tabs?.length) {
      return { valid: targetOptions?.length > 0, type: 'tag' };
    }

    return { valid: targetOptions?.length > 1, type: 'tabGroup' };
  }, [moveData, targetOptions]);

  const onCheckboxChange: CheckboxProps['onChange'] = (e) => {
    // console.log('checked = ', e.target.checked);
    setAutoMerge(e.target.checked);
  };

  const onCascaderChange = async (value: string[], selectedOptions: CascaderOption[]) => {
    setTargetValue(value);
    setTargetOptions(selectedOptions);
  };

  // 开始移动穿越
  const handleMoveTo = async () => {
    if (!moveData) return;
    if (!validInfo.valid) return;
    if (!targetOptions?.length) return;

    const { tagId, groupId, tabs = [] } = moveData;

    if (tagId) {
      await tabListUtils.allTabGroupsMoveThrough({
        sourceTagId: tagId,
        targetTagId: targetOptions[0].value,
        autoMerge,
      });

      onOk?.({ targetTagId: targetOptions[0].value });
    } else if (validInfo.type === 'tag' && groupId) {
      const { targetGroupId } = await tabListUtils.tabGroupMoveThrough({
        sourceGroupId: groupId,
        targetTagId: targetOptions[0].value,
        autoMerge,
      });

      onOk?.({ targetTagId: targetOptions[0].value, targetGroupId });
    } else if (validInfo.type === 'tabGroup' && groupId) {
      const targetTagId = targetOptions[0].value;
      const targetGroupId = targetOptions[1].value;
      await tabListUtils.tabMoveThrough({
        sourceGroupId: groupId,
        targetTagId,
        targetGroupId,
        tabs,
        autoMerge,
      });

      onOk?.({ targetTagId, targetGroupId });
    }

    setTargetValue([]);
    setTargetOptions([]);
  };

  const initData = async () => {
    const tagList = treeDataHook?.tagList || listData || (await tabListUtils.getTagList());
    const cascaderData = await getCascaderData(tagList, moveData);
    setOptions(cascaderData);
  };

  useEffect(() => {
    initData();
    if (!visible) {
      setTargetOptions([]);
    }
  }, [listData, visible]);

  return (
    <Modal
      title={$fmt('common.moveTo')}
      width={600}
      open={visible}
      onOk={handleMoveTo}
      onCancel={onCancel}
    >
      <Flex vertical gap="middle">
        <Space>
          <Checkbox checked={autoMerge} onChange={onCheckboxChange}>
            {$fmt('home.moveTo.mergeLabel')}
          </Checkbox>
          <Tooltip
            color={token.colorBgContainer}
            title={
              <Flex vertical>
                <Typography.Text>{$fmt('home.moveTo.mergeTip.1')}</Typography.Text>
                <Typography.Text>{$fmt('home.moveTo.mergeTip.2')}</Typography.Text>
              </Flex>
            }
          >
            <QuestionCircleOutlined />
          </Tooltip>
        </Space>
        <StyledCascaderWrapper>
          <Cascader.Panel
            options={options}
            value={targetValue}
            changeOnSelect
            onChange={onCascaderChange}
          ></Cascader.Panel>
          {!validInfo.valid && (
            <div style={{ marginTop: '12px', fontSize: '12px' }}>
              <Typography.Text type="danger">
                {$fmt({
                  id: 'home.moveTo.missingTip',
                  values: { type: $fmt(`home.${validInfo?.type || 'tag'}`) },
                })}
              </Typography.Text>
            </div>
          )}
        </StyledCascaderWrapper>
      </Flex>
    </Modal>
  );
}
