import { useState, useEffect, useContext } from 'react';
import { Modal, Cascader, Typography } from 'antd';
import styled from 'styled-components';
import { ContentGlobalContext } from '~/entrypoints/content/context';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { stateUtils, tabListUtils } from '~/entrypoints/common/storage';
import { StyledEllipsis } from '~/entrypoints/common/style/Common.styled';
import type { SendTargetProps } from '~/entrypoints/types';
import type { CascaderOption } from './types';
import { getTotalCascaderData } from './utils';

const StyledCascaderWrapper = styled.div`
  .nicetab-cascader-panel {
    width: 100%;
    position: relative;
    overflow-x: visible;
  }
  .nicetab-cascader-menus {
    position: relative;
    box-shadow: none;
    width: 100%;
  }
  .nicetab-cascader-menu {
    position: relative;
    flex: 1;
    min-height: 180px;
    max-height: 360px;
    overflow: auto;
    &:first-of-type {
      max-width: 35%;
    }

    &::-webkit-scrollbar {
      width: 8px !important;
      height: 8px !important;
    }

    &::-webkit-scrollbar-track {
      border-radius: 4px;
      background: ${props => props.theme.colorBgContainer || '#fff'};
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 4px;
      background: ${props =>
        `${props.theme.type === 'light' ? '#d9d9d9' : '#555'} !important`};
      box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.3);
    }

    &::-webkit-scrollbar-thumb:hover {
      background: ${props =>
        `${props.theme.type === 'light' ? '#bfbfbf' : '#888'} !important`};
    }
  }
  .cascader-label-custom {
    display: flex;
    align-items: center;
    gap: 4px;
    .label-name {
      flex: 1;
      width: 0;
      ${StyledEllipsis}
    }
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
  const contentContext = useContext(ContentGlobalContext);
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
    await stateUtils.setStateByModule('global', { lastSelectedTargetValue: targetValue });
  };

  const initDataFromState = useCallback(async (cascaderData: CascaderOption[]) => {
    const { lastSelectedTargetValue } = (await stateUtils.getState('global')) || {};
    let selectedTargetValue = ['0'];
    if (lastSelectedTargetValue?.length) {
      selectedTargetValue = lastSelectedTargetValue;
    }
    setTargetValue(selectedTargetValue);
    const selectedOptions = [];
    const selectedTagInfo = cascaderData.find(
      item => item.value === selectedTargetValue[0],
    );
    if (!selectedTagInfo) {
      selectedTargetValue = ['0'];
      setTargetValue(selectedTargetValue);
      return;
    }
    selectedOptions.push(selectedTagInfo);
    if (selectedTargetValue[1] != null) {
      const selectedGroupInfo = selectedTagInfo.children?.find(
        item => item.value === selectedTargetValue[1],
      );
      if (selectedGroupInfo) {
        selectedOptions.push(selectedGroupInfo);
      }
    }

    setTargetOptions(selectedOptions);
  }, []);

  const initData = async () => {
    const tagList = await tabListUtils.getTagList();
    const cascaderData = await getTotalCascaderData(tagList);
    setOptions(cascaderData);
    initDataFromState(cascaderData);
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
      centered
      getContainer={() => contentContext.rootWrapper}
      open={visible}
      onOk={handleSending}
      onCancel={onCancel}
    >
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
    </Modal>
  );
}
