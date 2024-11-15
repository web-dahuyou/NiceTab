import { useState, useEffect } from 'react';
import { Modal, Cascader, Typography, Flex } from 'antd';
import styled from 'styled-components';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { tabListUtils } from '~/entrypoints/common/storage';
import type { SendTargetProps } from '~/entrypoints/types';
import type { CascaderOption } from './types';
import { getTotalCascaderData } from './utils';

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

interface SendTargetModalProps {
  visible: boolean;
  onOk?: ({ targetTagId, targetGroupId }: SendTargetProps) => void;
  onCancel?: () => void;
}
export default function SendTargetModal({
  visible = false,
  onOk,
  onCancel,
}: SendTargetModalProps) {
  const { $fmt } = useIntlUtls();
  const [options, setOptions] = useState<CascaderOption[]>([]); // 级联数据
  const [targetValue, setTargetValue] = useState<string[]>([]); // 选中的目标值
  const [targetOptions, setTargetOptions] = useState<CascaderOption[]>([]); // 选中的目标选项

  const onCascaderChange = async (value: string[], selectedOptions: CascaderOption[]) => {
    setTargetValue(value);
    setTargetOptions(selectedOptions);
  };

  // 发送到指定的分类或者标签组
  const handleSending = async () => {
    if (!targetOptions?.length) return;
    const [tagInfo, groupInfo] = targetOptions;
    onOk?.({ targetTagId: tagInfo?.value || '', targetGroupId: groupInfo?.value || '' });

    setTargetValue([]);
    setTargetOptions([]);
  };

  const initData = async () => {
    const tagList = await tabListUtils.getTagList();
    const cascaderData = await getTotalCascaderData(tagList);
    setOptions(cascaderData);
  };

  useEffect(() => {
    initData();
    if (!visible) {
      setTargetOptions([]);
    }
  }, [visible]);

  return (
    <Modal
      title={$fmt('common.sendTo')}
      width={600}
      open={visible}
      onOk={handleSending}
      onCancel={onCancel}
    >
      <Flex vertical gap="middle">
        <StyledCascaderWrapper>
          <Cascader.Panel
            options={options}
            value={targetValue}
            changeOnSelect
            onChange={onCascaderChange}
          ></Cascader.Panel>
          {!targetOptions?.length && (
            <div style={{ marginTop: '12px', fontSize: '12px' }}>
              <Typography.Text type="danger">
                {$fmt({
                  id: 'home.moveTo.missingTip',
                  values: { type: $fmt(`home.tag`) },
                })}
              </Typography.Text>
            </div>
          )}
        </StyledCascaderWrapper>
      </Flex>
    </Modal>
  );
}
