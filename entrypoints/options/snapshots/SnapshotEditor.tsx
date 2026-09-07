import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  CheckCircleFilled,
  DeleteOutlined,
  DragOutlined,
  EditOutlined,
  PlusOutlined,
  PushpinFilled,
  SaveOutlined,
} from '@ant-design/icons';
import DndComponent, {
  type DragData,
} from '~/entrypoints/common/components/DndComponent';
import Favicon from '~/entrypoints/common/components/Favicon';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { getRandomId, newCreateTime } from '~/entrypoints/common/utils';
import { ENUM_COLORS } from '~/entrypoints/common/constants';
import type {
  SnapshotGroupColor,
  SnapshotRecord,
  WindowSnapshotGroup,
  WindowSnapshotItem,
  WindowSnapshotTab,
} from '~/entrypoints/types';

const tabDndKey = Symbol('snapshot-tab');
const groupDndKey = Symbol('snapshot-group');
const ROOT_CONTAINER_ID = '__snapshot-root__';

const groupColors: SnapshotGroupColor[] = [
  'grey',
  'blue',
  'red',
  'yellow',
  'green',
  'pink',
  'purple',
  'cyan',
  'orange',
];

type SnapshotTabDragData = DragData & {
  itemId: string;
  containerId: string;
  isEmpty?: boolean;
};

type SnapshotGroupDragData = DragData & {
  itemId: string;
};

type TabEditState = {
  tab: WindowSnapshotTab;
  containerId: string;
  isNew: boolean;
};

function cloneRecord(record: SnapshotRecord): SnapshotRecord {
  return JSON.parse(JSON.stringify(record)) as SnapshotRecord;
}

function flattenTabs(items: WindowSnapshotItem[]) {
  return items.flatMap(item => (item.type === 'group' ? item.tabs : [item]));
}

function normalizeItems(items: WindowSnapshotItem[]) {
  const normalized = items.map(item => {
    if (item.type === 'group') {
      return {
        ...item,
        tabs: item.tabs.map(tab => ({ ...tab, pinned: false })),
      };
    }
    return item;
  });
  const pinned = normalized.filter(
    (item): item is WindowSnapshotTab => item.type === 'tab' && item.pinned,
  );
  const rest = normalized.filter(item => item.type !== 'tab' || !item.pinned);
  const result = [...pinned, ...rest];
  const tabs = flattenTabs(result);
  const activeTab = tabs.find(tab => tab.active) || tabs[0];
  tabs.forEach(tab => {
    tab.active = tab.id === activeTab?.id;
  });
  return result;
}

function removeTab(items: WindowSnapshotItem[], tabId: string) {
  let removed: WindowSnapshotTab | undefined;
  const next = items.reduce<WindowSnapshotItem[]>((result, item) => {
    if (item.type === 'tab') {
      if (item.id === tabId) {
        removed = item;
        return result;
      }
      result.push(item);
      return result;
    }
    const tabs = item.tabs.filter(tab => {
      if (tab.id === tabId) {
        removed = tab;
        return false;
      }
      return true;
    });
    result.push({ ...item, tabs });
    return result;
  }, []);
  return { items: next, removed };
}

export default function SnapshotEditor({
  record,
  onSave,
}: {
  record: SnapshotRecord;
  onSave: (record: SnapshotRecord) => Promise<void>;
}) {
  const { $fmt } = useIntlUtls();
  const [draft, setDraft] = useState(() => cloneRecord(record));
  const [dirty, setDirty] = useState(false);
  const [tabEdit, setTabEdit] = useState<TabEditState>();
  const [groupEdit, setGroupEdit] = useState<WindowSnapshotGroup | null>();
  const [tabForm] = Form.useForm<WindowSnapshotTab>();
  const [groupForm] = Form.useForm<WindowSnapshotGroup>();

  useEffect(() => {
    setDraft(cloneRecord(record));
    setDirty(false);
  }, [record.id, record.updatedAt]);

  useEffect(() => {
    if (tabEdit) tabForm.setFieldsValue(tabEdit.tab);
  }, [tabEdit, tabForm]);

  useEffect(() => {
    if (groupEdit) groupForm.setFieldsValue(groupEdit);
  }, [groupEdit, groupForm]);

  const updateItems = (items: WindowSnapshotItem[]) => {
    setDraft(value => ({ ...value, items: normalizeItems(items) }));
    setDirty(true);
  };

  const handleTabDrop = ({
    sourceData,
    targetData,
    sourceIndex,
    targetIndex,
  }: {
    sourceData: SnapshotTabDragData;
    targetData: SnapshotTabDragData;
    sourceIndex: number;
    targetIndex: number;
  }) => {
    if (!sourceData.itemId || sourceData.itemId === targetData.itemId) return;
    const removedResult = removeTab(draft.items, sourceData.itemId);
    if (!removedResult.removed) return;
    const movedTab = {
      ...removedResult.removed,
      pinned:
        targetData.containerId === ROOT_CONTAINER_ID && removedResult.removed.pinned,
    };
    let insertAt = targetIndex;
    if (sourceData.containerId === targetData.containerId && sourceIndex < targetIndex) {
      insertAt--;
    }

    if (targetData.containerId === ROOT_CONTAINER_ID) {
      const items = [...removedResult.items];
      items.splice(Math.max(0, insertAt), 0, movedTab);
      updateItems(items);
      return;
    }

    updateItems(
      removedResult.items.map(item =>
        item.type === 'group' && item.id === targetData.containerId
          ? {
              ...item,
              tabs: [
                ...item.tabs.slice(0, Math.max(0, insertAt)),
                { ...movedTab, pinned: false },
                ...item.tabs.slice(Math.max(0, insertAt)),
              ],
            }
          : item,
      ),
    );
  };

  const handleGroupDrop = ({
    sourceData,
    sourceIndex,
    targetIndex,
  }: {
    sourceData: SnapshotGroupDragData;
    targetData: SnapshotGroupDragData;
    sourceIndex: number;
    targetIndex: number;
  }) => {
    const groups = draft.items.filter(
      (item): item is WindowSnapshotGroup => item.type === 'group',
    );
    const sourceGroup = groups.find(item => item.id === sourceData.itemId);
    if (!sourceGroup) return;
    groups.splice(sourceIndex, 1);
    groups.splice(
      sourceIndex < targetIndex ? targetIndex - 1 : targetIndex,
      0,
      sourceGroup,
    );
    let groupIndex = 0;
    updateItems(
      draft.items.map(item => (item.type === 'group' ? groups[groupIndex++] : item)),
    );
  };

  const openNewTab = (containerId = ROOT_CONTAINER_ID) => {
    setTabEdit({
      isNew: true,
      containerId,
      tab: {
        type: 'tab',
        id: getRandomId(16),
        title: '',
        url: 'https://',
        pinned: false,
        active: flattenTabs(draft.items).length === 0,
      },
    });
  };

  const saveTab = async () => {
    const values = await tabForm.validateFields();
    const edited = { ...tabEdit!.tab, ...values };
    let items = draft.items;
    if (!tabEdit!.isNew) items = removeTab(items, edited.id).items;
    if (edited.active) {
      flattenTabs(items).forEach(tab => {
        tab.active = false;
      });
    }
    if (tabEdit!.containerId === ROOT_CONTAINER_ID || edited.pinned) {
      items = [edited, ...items];
    } else {
      items = items.map(item =>
        item.type === 'group' && item.id === tabEdit!.containerId
          ? { ...item, tabs: [...item.tabs, { ...edited, pinned: false }] }
          : item,
      );
    }
    updateItems(items);
    setTabEdit(undefined);
    tabForm.resetFields();
  };

  const saveGroup = async () => {
    const values = await groupForm.validateFields();
    if (groupEdit) {
      updateItems(
        draft.items.map(item =>
          item.type === 'group' && item.id === groupEdit.id
            ? { ...item, ...values }
            : item,
        ),
      );
    } else {
      updateItems([
        ...draft.items,
        {
          type: 'group',
          id: getRandomId(16),
          title: values.title,
          color: values.color || 'grey',
          collapsed: !!values.collapsed,
          tabs: [],
        },
      ]);
    }
    setGroupEdit(undefined);
    groupForm.resetFields();
  };

  const renderTab = (tab: WindowSnapshotTab, containerId: string, index: number) => (
    <DndComponent<SnapshotTabDragData>
      key={tab.id}
      dndKey={tabDndKey}
      canDrag
      data={{ itemId: tab.id, containerId, index, groupId: containerId }}
      mainField="itemId"
      showDragPreview
      previewContent={tab.title || tab.url}
      onDrop={handleTabDrop}
    >
      <div className="tab-row" tabIndex={0}>
        <DragOutlined className="drag-handle" />
        {tab.pinned && <PushpinFilled title={$fmt('snapshots.pinned')} />}
        {tab.active && (
          <CheckCircleFilled
            title={$fmt('snapshots.active')}
            style={{ color: ENUM_COLORS.green }}
          />
        )}
        <Favicon pageUrl={tab.url} favIconUrl={tab.favIconUrl} />
        <div className="tab-content">
          <div className="tab-title">{tab.title || tab.url}</div>
          <div className="tab-url">{tab.url}</div>
        </div>
        <Space size={4}>
          <Tooltip title={$fmt('common.edit')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => setTabEdit({ tab, containerId, isNew: false })}
            />
          </Tooltip>
          <Tooltip title={$fmt('common.delete')}>
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => updateItems(removeTab(draft.items, tab.id).items)}
            />
          </Tooltip>
        </Space>
      </div>
    </DndComponent>
  );

  const renderDropTarget = (containerId: string, index: number) => (
    <DndComponent<SnapshotTabDragData>
      key={`${containerId}-drop-target`}
      dndKey={tabDndKey}
      canDrag={false}
      data={{
        itemId: `${containerId}-drop-target`,
        containerId,
        groupId: containerId,
        index,
        isEmpty: true,
      }}
      mainField="itemId"
      onDrop={handleTabDrop}
    >
      <div className="drop-target">{$fmt('snapshots.dropHere')}</div>
    </DndComponent>
  );

  let groupIndex = 0;

  return (
    <div className="snapshot-editor">
      <div className="editor-toolbar">
        <Input
          className="snapshot-name-input"
          value={draft.name}
          maxLength={80}
          aria-label={$fmt('snapshots.snapshotName')}
          onChange={event => {
            setDraft(value => ({ ...value, name: event.target.value }));
            setDirty(true);
          }}
        />
        <Space wrap>
          {dirty && (
            <Typography.Text type="warning">{$fmt('snapshots.unsaved')}</Typography.Text>
          )}
          <Button icon={<PlusOutlined />} onClick={() => openNewTab()}>
            {$fmt('snapshots.addTab')}
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={() => {
              setGroupEdit(null);
              groupForm.setFieldsValue({ title: '', color: 'grey', collapsed: false });
            }}
          >
            {$fmt('snapshots.addGroup')}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            disabled={!dirty || !draft.name.trim()}
            onClick={async () => {
              await onSave({
                ...draft,
                name: draft.name.trim(),
                updatedAt: newCreateTime(),
              });
              setDirty(false);
            }}
          >
            {$fmt('common.save')}
          </Button>
        </Space>
      </div>

      <div className="snapshot-items">
        {draft.items.map((item, itemIndex) => {
          if (item.type === 'tab') {
            return renderTab(item, ROOT_CONTAINER_ID, itemIndex);
          }
          const currentGroupIndex = groupIndex++;
          return (
            <DndComponent<SnapshotGroupDragData>
              key={item.id}
              dndKey={groupDndKey}
              canDrag
              data={{ itemId: item.id, index: currentGroupIndex }}
              mainField="itemId"
              showDragPreview
              previewContent={item.title || $fmt('snapshots.ungrouped')}
              onDrop={handleGroupDrop}
            >
              <div className="snapshot-group">
                <div className="group-header">
                  <div className="group-title">
                    <DragOutlined className="drag-handle" />
                    <Tag color={item.color}>{item.color}</Tag>
                    <span>{item.title || $fmt('snapshots.ungrouped')}</span>
                    <Typography.Text type="secondary">{item.tabs.length}</Typography.Text>
                  </div>
                  <Space size={4}>
                    <Tooltip title={$fmt('snapshots.addTab')}>
                      <Button
                        type="text"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => openNewTab(item.id)}
                      />
                    </Tooltip>
                    <Tooltip title={$fmt('common.edit')}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => setGroupEdit(item)}
                      />
                    </Tooltip>
                    <Tooltip title={$fmt('common.delete')}>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() =>
                          Modal.confirm({
                            title: $fmt('common.confirmReminder'),
                            content: $fmt('snapshots.deleteGroupConfirm'),
                            onOk: () =>
                              updateItems(
                                draft.items.filter(value => value.id !== item.id),
                              ),
                          })
                        }
                      />
                    </Tooltip>
                  </Space>
                </div>
                <div className="group-tabs">
                  {item.tabs.map((tab, index) => renderTab(tab, item.id, index))}
                  {renderDropTarget(item.id, item.tabs.length)}
                </div>
              </div>
            </DndComponent>
          );
        })}
        {renderDropTarget(ROOT_CONTAINER_ID, draft.items.length)}
      </div>

      <Modal
        title={$fmt('snapshots.editTab')}
        open={!!tabEdit}
        destroyOnClose
        onOk={saveTab}
        onCancel={() => setTabEdit(undefined)}
      >
        <Form form={tabForm} layout="vertical">
          <Form.Item
            name="title"
            label={$fmt('common.title')}
            rules={[{ required: true }]}
          >
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item
            name="url"
            label={$fmt('common.url')}
            rules={[
              { required: true },
              {
                validator: (_, value) =>
                  /^[a-z][a-z\d+.-]*:/i.test(value || '')
                    ? Promise.resolve()
                    : Promise.reject(new Error($fmt('snapshots.invalidUrl'))),
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="pinned"
            label={$fmt('snapshots.pinned')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="active"
            label={$fmt('snapshots.active')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={$fmt('snapshots.editGroup')}
        open={groupEdit !== undefined}
        destroyOnClose
        onOk={saveGroup}
        onCancel={() => {
          setGroupEdit(undefined);
          groupForm.resetFields();
        }}
      >
        <Form form={groupForm} layout="vertical">
          <Form.Item name="title" label={$fmt('snapshots.groupName')}>
            <Input maxLength={80} />
          </Form.Item>
          <Form.Item name="color" label={$fmt('snapshots.groupColor')}>
            <Select
              options={groupColors.map(color => ({
                value: color,
                label: (
                  <Space size={6}>
                    <Tag color={color} style={{ width: 18, height: 18, margin: 0 }} />
                    <span>{color}</span>
                  </Space>
                ),
              }))}
            />
          </Form.Item>
          <Form.Item
            name="collapsed"
            label={$fmt('snapshots.groupCollapsed')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
