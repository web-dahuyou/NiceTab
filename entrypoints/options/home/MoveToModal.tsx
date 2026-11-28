import { useContext, useState, useEffect, useRef } from 'react';
import {
  theme,
  Button,
  Checkbox,
  Modal,
  Cascader,
  Typography,
  Flex,
  Space,
  Tooltip,
} from 'antd';
import type { CheckboxProps } from 'antd';
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import { tabListUtils } from '~/entrypoints/common/storage';
import { reloadOtherAdminPage } from '~/entrypoints/common/tabs';
import { StyledEllipsis } from '~/entrypoints/common/style/Common.styled';
import { ContentGlobalContext } from '~/entrypoints/content/context';
import type { TagItem } from '~/entrypoints/types';
import type { MoveDataProps, MoveTargetProps, CascaderOption } from './types';
import { HomeContext } from './hooks/treeData';
import { getCascaderData } from './utils';
import NodeCreateModal from './NodeCreateModal';

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

interface MoveToModalProps {
  visible: boolean;
  listData?: TagItem[];
  onOk?: ({ targetTagId, targetGroupId }: MoveTargetProps) => void;
  onCancel?: () => void;
  moveData?: MoveDataProps;
  onProcessed?: (ids: string[]) => void;
  onDestinationCreated?: () => void;
}
export default function MoveToModal({
  visible = false,
  onOk,
  onCancel,
  listData,
  moveData,
  onProcessed,
  onDestinationCreated,
}: MoveToModalProps) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const { $message } = useContext(GlobalContext);
  const contentContext = useContext(ContentGlobalContext);
  const { treeDataHook } = useContext(HomeContext);
  const [options, setOptions] = useState<CascaderOption[]>([]); // 级联数据
  const [targetValue, setTargetValue] = useState<string[]>([]); // 选中的目标值
  const [moving, setMoving] = useState(false);
  const [creating, setCreating] = useState(false);
  const workingRef = useRef(false);
  const [isCopy, setIsCopy] = useState<boolean>(false); // 是否拷贝
  const [autoMerge, setAutoMerge] = useState<boolean>(false); // 是否自动合并
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createModalType, setCreateModalType] = useState<'tag' | 'tabGroup'>('tag');

  const { tagId, groupId, groupIds, tabs = [], selectedTabs } = moveData || {};
  const isBatchTabs = !!selectedTabs?.length && !tagId && !groupId && !groupIds?.length;
  const isMovingTabs =
    isBatchTabs || (!!groupId && !!tabs.length && !tagId && !groupIds?.length);
  const [targetTagId, targetGroupId] = targetValue;
  const targetTag = options.find(option => option.value === targetTagId);
  const targetGroup = targetTag?.children?.find(option => option.value === targetGroupId);
  const validTarget =
    !!(isBatchTabs || tagId || groupId || groupIds?.length) &&
    !!targetTag &&
    !targetTag.disabled &&
    (!isMovingTabs || (!!targetGroup && !targetGroup.disabled));
  const canCreateGroup =
    isMovingTabs && !!targetTag && !targetTag.disabled && !targetTag.originData?.isLocked;
  const working = moving || creating;

  const onCheckboxChange: CheckboxProps['onChange'] = e => {
    // console.log('checked = ', e.target.checked);
    setAutoMerge(e.target.checked);
  };
  const onCopyCheckboxChange: CheckboxProps['onChange'] = e => {
    // console.log('checked = ', e.target.checked);
    setIsCopy(e.target.checked);
  };

  const onCascaderChange = (value: string[]) => {
    if (workingRef.current) return;
    setTargetValue(value);
  };

  // 开始移动穿越
  const handleMoveTo = async () => {
    if (!validTarget || workingRef.current) return;
    workingRef.current = true;
    setMoving(true);
    try {
      if (isBatchTabs) {
        const { processedTabIds } = await tabListUtils.tabsMoveThrough({
          tabs: selectedTabs,
          targetTagId,
          targetGroupId,
          isCopy,
          autoMerge,
        });
        if (!processedTabIds.length) {
          await refreshOptions();
          $message.error($fmt('common.operationFailed'));
          return;
        }
        if (processedTabIds.length < selectedTabs.length) {
          $message.warning($fmt('home.treeNodeBatch.failed'));
        }
        onProcessed?.(processedTabIds);
        onOk?.({ targetTagId, targetGroupId });
      } else if (groupIds?.length) {
        const { processedIds } = await tabListUtils.tabGroupsMoveThrough({
          sourceGroupIds: groupIds,
          targetTagId,
          isCopy,
          autoMerge,
        });
        onProcessed?.(processedIds);
        onOk?.({ targetTagId });
        if (processedIds.length) await reloadOtherAdminPage();
      } else if (tagId) {
        await tabListUtils.allTabGroupsMoveThrough({
          sourceTagId: tagId,
          targetTagId,
          isCopy,
          autoMerge,
        });

        onOk?.({ targetTagId });
      } else if (groupId && !isMovingTabs) {
        const { targetGroupId } = await tabListUtils.tabGroupMoveThrough({
          sourceGroupId: groupId,
          targetTagId,
          isCopy,
          autoMerge,
        });

        onOk?.({ targetTagId, targetGroupId });
      } else if (groupId) {
        const moved = await tabListUtils.tabMoveThrough({
          sourceGroupId: groupId,
          targetTagId,
          targetGroupId,
          tabs,
          isCopy,
          autoMerge,
        });
        if (!moved) {
          const refreshedOptions = await refreshOptions();
          const category = refreshedOptions.find(option => option.value === targetTagId);
          setTargetValue(category && !category.disabled ? [targetTagId] : []);
          $message.error($fmt('common.operationFailed'));
          return;
        }

        onOk?.({ targetTagId, targetGroupId });
      }

      setTargetValue([]);
    } catch (error) {
      console.error('Move tab groups failed', error);
      $message.error($fmt('common.operationFailed'));
    } finally {
      workingRef.current = false;
      setMoving(false);
      if (moveData?.groupIds?.length || moveData?.selectedTabs?.length) {
        treeDataHook?.refreshTreeData?.();
      }
    }
  };

  const initData = async () => {
    const tagList =
      treeDataHook?.tagList || listData || (await tabListUtils.getTagList());
    const cascaderData = await getCascaderData(tagList, moveData);
    setOptions(cascaderData);
  };

  // 重新读取级联数据，用于新建分类、标签组后实时更新
  const refreshOptions = async () => {
    const tagList = await tabListUtils.getTagList();
    const cascaderData = await getCascaderData(tagList, moveData);
    setOptions(cascaderData);
    return cascaderData;
  };

  const handleOpenCreateModal = (type: 'tag' | 'tabGroup') => {
    setCreateModalType(type);
    setCreateModalVisible(true);
  };

  const handleCreateConfirm = async (name: string) => {
    if (workingRef.current) return;
    workingRef.current = true;
    setCreating(true);
    setCreateModalVisible(false);
    try {
      let newTarget: string[];
      if (createModalType === 'tag') {
        const newTag: TagItem = await tabListUtils.addTag({ tagName: name } as TagItem);
        newTarget = [newTag.tagId];
      } else {
        const tagList = await tabListUtils.getTagList();
        if (
          !canCreateGroup ||
          !tagList.some(tag => tag.tagId === targetTagId && !tag.isLocked)
        ) {
          setOptions(await getCascaderData(tagList, moveData));
          $message.error($fmt('common.operationFailed'));
          return;
        }
        const { tabGroup } = await tabListUtils.createTabGroup(targetTagId, {
          groupName: name,
        });
        newTarget = [targetTagId, tabGroup.groupId];
      }
      await refreshOptions();
      setTargetValue(newTarget);
      treeDataHook?.refreshTreeData?.();
      onDestinationCreated?.();
    } catch (error) {
      console.error('Create tag or tab group failed', error);
      $message.error($fmt('common.operationFailed'));
    } finally {
      workingRef.current = false;
      setCreating(false);
    }
  };

  useEffect(() => {
    if (visible) {
      initData();
    } else {
      setTargetValue([]);
    }
  }, [listData, visible]);

  return (
    <>
      <Modal
        title={$fmt('common.moveTo')}
        width={600}
        centered
        getContainer={() => contentContext.rootWrapper}
        open={visible}
        onOk={handleMoveTo}
        confirmLoading={moving}
        okButtonProps={{ disabled: !validTarget || creating }}
        cancelButtonProps={{ disabled: working }}
        closable={!working}
        maskClosable={!working}
        keyboard={!working}
        onCancel={working ? undefined : onCancel}
      >
        <Flex vertical gap="middle">
          <Space>
            <Checkbox disabled={working} checked={isCopy} onChange={onCopyCheckboxChange}>
              {$fmt('home.moveTo.copyLabel')}
            </Checkbox>
            <Tooltip
              color={token.colorBgContainer}
              title={<Typography.Text>{$fmt('home.moveTo.copyTip')}</Typography.Text>}
            >
              <QuestionCircleOutlined />
            </Tooltip>
            <Checkbox disabled={working} checked={autoMerge} onChange={onCheckboxChange}>
              {$fmt('home.moveTo.mergeLabel')}
            </Checkbox>
            <Tooltip
              color={token.colorBgContainer}
              title={
                <Flex vertical>
                  <Typography.Text>{$fmt('home.moveTo.mergeTip.1')}</Typography.Text>
                  <Typography.Text>{$fmt('home.moveTo.mergeTip.2')}</Typography.Text>
                  <Typography.Text>{$fmt('home.moveTo.mergeTip.3')}</Typography.Text>
                </Flex>
              }
            >
              <QuestionCircleOutlined />
            </Tooltip>
          </Space>
          <Space size={8}>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              disabled={working}
              onClick={() => handleOpenCreateModal('tag')}
            >
              {$fmt('home.addTag')}
            </Button>
            {isMovingTabs && (
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                disabled={working || !canCreateGroup}
                onClick={() => handleOpenCreateModal('tabGroup')}
              >
                {$fmt('home.createTabGroup')}
              </Button>
            )}
          </Space>
          <StyledCascaderWrapper>
            <Cascader.Panel
              options={options}
              value={targetValue}
              changeOnSelect
              onChange={onCascaderChange}
            ></Cascader.Panel>
            {!validTarget && (
              <div style={{ marginTop: '12px', fontSize: '12px' }}>
                <Typography.Text type="danger">
                  {$fmt({
                    id: 'home.moveTo.missingTip',
                    values: { type: $fmt(isMovingTabs ? 'home.tabGroup' : 'home.tag') },
                  })}
                </Typography.Text>
              </div>
            )}
          </StyledCascaderWrapper>
        </Flex>
      </Modal>
      {/* 保持挂载，让创建弹窗关闭后恢复焦点。 */}
      <NodeCreateModal
        visible={createModalVisible}
        createType={createModalType}
        onOk={handleCreateConfirm}
        onCancel={() => setCreateModalVisible(false)}
      />
    </>
  );
}
