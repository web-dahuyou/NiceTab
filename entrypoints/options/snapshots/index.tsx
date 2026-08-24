import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Drawer,
  Dropdown,
  Empty,
  Input,
  Menu,
  Modal,
  Space,
  Tag,
  Typography,
  type MenuProps,
} from 'antd';
import {
  CameraOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  EyeOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { initSnapshotStorageListener, snapshotUtils } from '~/entrypoints/common/storage';
import {
  restoreSnapshotRecord,
  saveOpenedTabsAsSnapshot,
} from '~/entrypoints/common/tabs';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import type { SnapshotRecord, SnapshotStore } from '~/entrypoints/types';
import SidebarLayout from '~/entrypoints/options/components/SidebarLayout';
import SnapshotDetails from './SnapshotDetails';
import StyledSnapshotsPage from './Snapshots.styled';

const emptyStore: SnapshotStore = { version: 2, manual: [] };

function getStats(record: SnapshotRecord) {
  let tabs = 0;
  let groups = 0;
  let pinned = 0;
  record.items.forEach(item => {
    if (item.type === 'group') {
      groups++;
      tabs += item.tabs.length;
    } else {
      tabs++;
      if (item.pinned) pinned++;
    }
  });
  return { tabs, groups, pinned };
}

export default function SnapshotsPage() {
  const { $fmt } = useIntlUtls();
  const { $message } = useContext(GlobalContext);
  const [store, setStore] = useState<SnapshotStore>(emptyStore);
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState<'manual' | 'auto'>('manual');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [detailRecord, setDetailRecord] = useState<SnapshotRecord>();

  const loadStore = useCallback(async () => {
    setStore({ ...(await snapshotUtils.getStore()) });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStore();
    return initSnapshotStorageListener(loadStore);
  }, [loadStore]);

  useEffect(() => {
    if (window.matchMedia('(max-width: 840px)').matches) setSidebarCollapsed(true);
  }, []);

  useEffect(() => {
    if (!detailRecord) return;
    const record =
      detailRecord.source === 'auto'
        ? store.auto
        : store.manual.find(item => item.id === detailRecord.id);
    if (!record) setDetailRecord(undefined);
    else if (record.updatedAt !== detailRecord.updatedAt) setDetailRecord(record);
  }, [store, detailRecord]);

  const createSnapshot = useCallback(
    async (removeOldest = false) => {
      const result = await saveOpenedTabsAsSnapshot('manualSave', { removeOldest });
      if (result && 'limitReached' in result && result.limitReached) {
        Modal.confirm({
          title: $fmt('snapshots.limitTitle'),
          content: $fmt('snapshots.limitContent'),
          onOk: () => createSnapshot(true),
        });
        return;
      }
      if (result?.saved) $message.success($fmt('snapshots.created'));
    },
    [$fmt, $message],
  );

  const restore = useCallback(
    async (record: SnapshotRecord, mode: 'newWindow' | 'replaceCurrent') => {
      const execute = async () => {
        const result = await restoreSnapshotRecord(record, mode);
        $message.info($fmt({ id: 'snapshots.restoreResult', values: result }));
      };
      if (mode === 'replaceCurrent') {
        Modal.confirm({
          title: $fmt('common.confirmReminder'),
          content: $fmt('snapshots.restoreCurrentConfirm'),
          onOk: execute,
        });
      } else {
        await execute();
      }
    },
    [$fmt, $message],
  );

  const remove = useCallback(
    (record: SnapshotRecord) => {
      Modal.confirm({
        title: $fmt('common.confirmReminder'),
        content: $fmt('snapshots.deleteConfirm'),
        onOk: () => snapshotUtils.remove(record.id, record.source),
      });
    },
    [$fmt],
  );

  const rename = useCallback(
    (record: SnapshotRecord) => {
      let name = record.name;
      Modal.confirm({
        title: $fmt('snapshots.rename'),
        content: (
          <Input
            defaultValue={record.name}
            maxLength={80}
            autoFocus
            onChange={event => {
              name = event.target.value;
            }}
          />
        ),
        onOk: async () => {
          const normalized = name.trim();
          if (!normalized) return Promise.reject();
          await snapshotUtils.update({ ...record, name: normalized });
          $message.success($fmt('snapshots.saved'));
        },
      });
    },
    [$fmt, $message],
  );

  const renderRecord = (record: SnapshotRecord) => {
    const stats = getStats(record);
    const restoreItems: MenuProps['items'] = [
      { key: 'newWindow', label: $fmt('snapshots.restoreNewWindow') },
      {
        key: 'replaceCurrent',
        label: $fmt('snapshots.restoreCurrentWindow'),
        danger: true,
      },
    ];
    return (
      <div className="snapshot-record" key={record.id}>
        <div className="snapshot-heading">
          <div className="snapshot-name">{record.name}</div>
          <div className="snapshot-meta">
            {record.updatedAt} · {$fmt({ id: 'snapshots.stats', values: stats })}
          </div>
        </div>
        <Space className="snapshot-actions" wrap>
          {record.source === 'auto' && <Tag color="blue">{$fmt('common.auto')}</Tag>}
          <Button icon={<EyeOutlined />} onClick={() => setDetailRecord(record)}>
            {$fmt('common.view')}
          </Button>
          <Dropdown
            menu={{
              items: restoreItems,
              onClick: ({ key }) => restore(record, key as 'newWindow' | 'replaceCurrent'),
            }}
          >
            <Button icon={<HistoryOutlined />}>
              {$fmt('home.restoreSnapshot')} <DownOutlined />
            </Button>
          </Dropdown>
          {record.source === 'manual' && (
            <>
              <Button
                type="text"
                icon={<EditOutlined />}
                title={$fmt('snapshots.rename')}
                onClick={() => rename(record)}
              />
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                title={$fmt('common.delete')}
                onClick={() => remove(record)}
              />
            </>
          )}
        </Space>
      </div>
    );
  };

  const records = module === 'manual' ? store.manual : store.auto ? [store.auto] : [];
  const sidebarItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'manual',
        label: (
          <span className="sidebar-label">
            <span>{$fmt('snapshots.manual')}</span>
            <Typography.Text type="secondary">{store.manual.length}</Typography.Text>
          </span>
        ),
      },
      { key: 'auto', label: $fmt('snapshots.auto') },
    ],
    [$fmt, store.manual.length],
  );

  return (
    <StyledSnapshotsPage
      style={
        {
          '--snapshot-sidebar-width': `${sidebarCollapsed ? 0 : sidebarWidth}px`,
        } as React.CSSProperties
      }
    >
      <SidebarLayout
        className="snapshot-sidebar"
        collapsed={sidebarCollapsed}
        sidebarWidth={sidebarWidth}
        initialWidth={240}
        onCollapseChange={setSidebarCollapsed}
        onWidthChange={setSidebarWidth}
        innerContent={
          <Menu
            mode="vertical"
            selectedKeys={[module]}
            items={sidebarItems}
            onClick={({ key }) => setModule(key as 'manual' | 'auto')}
          />
        }
      />
      <main className="snapshot-main">
        <div className="snapshot-toolbar">
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {$fmt(module === 'manual' ? 'snapshots.manual' : 'snapshots.auto')}
            </Typography.Title>
            {module === 'manual' && (
              <Typography.Text type="secondary">{store.manual.length} / 50</Typography.Text>
            )}
          </div>
          {module === 'manual' && (
            <Button
              type="primary"
              icon={<CameraOutlined />}
              loading={loading}
              onClick={() => createSnapshot()}
            >
              {$fmt('snapshots.create')}
            </Button>
          )}
        </div>
        <div className="snapshot-list">
          {records.length ? (
            records.map(renderRecord)
          ) : (
            <Empty
              description={$fmt(module === 'manual' ? 'snapshots.empty' : 'snapshots.autoEmpty')}
            />
          )}
        </div>
      </main>
      <Drawer
        title={detailRecord?.name}
        width={720}
        open={!!detailRecord}
        destroyOnClose
        onClose={() => setDetailRecord(undefined)}
      >
        {detailRecord && <SnapshotDetails record={detailRecord} />}
      </Drawer>
    </StyledSnapshotsPage>
  );
}
