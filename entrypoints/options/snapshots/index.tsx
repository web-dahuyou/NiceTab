import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Collapse,
  Dropdown,
  Empty,
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
  HistoryOutlined,
} from '@ant-design/icons';
import { initSnapshotStorageListener, snapshotUtils } from '~/entrypoints/common/storage';
import {
  restoreSnapshotRecord,
  saveOpenedTabsAsSnapshot,
} from '~/entrypoints/common/tabs';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import type { SnapshotRecord, SnapshotStore } from '~/entrypoints/types';
import SnapshotEditor from './SnapshotEditor';
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
      pinned += item.tabs.filter(tab => tab.pinned).length;
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

  const loadStore = useCallback(async () => {
    setStore({ ...(await snapshotUtils.getStore()) });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStore();
    return initSnapshotStorageListener(loadStore);
  }, [loadStore]);

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
        $message.info(
          $fmt({
            id: 'snapshots.restoreResult',
            values: result,
          }),
        );
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

  const renderRecordHeader = (record: SnapshotRecord) => {
    const stats = getStats(record);
    const restoreItems: MenuProps['items'] = [
      {
        key: 'newWindow',
        label: $fmt('snapshots.restoreNewWindow'),
      },
      {
        key: 'replaceCurrent',
        label: $fmt('snapshots.restoreCurrentWindow'),
        danger: true,
      },
    ];
    return (
      <div className="snapshot-header">
        <div className="snapshot-heading">
          <div className="snapshot-name">{record.name}</div>
          <div className="snapshot-meta">
            {record.updatedAt} · {$fmt({ id: 'snapshots.stats', values: stats })}
          </div>
        </div>
        <Space className="snapshot-actions" onClick={event => event.stopPropagation()}>
          {record.source === 'auto' && <Tag color="blue">{$fmt('common.auto')}</Tag>}
          <Dropdown
            menu={{
              items: restoreItems,
              onClick: ({ key }) =>
                restore(record, key as 'newWindow' | 'replaceCurrent'),
            }}
          >
            <Button icon={<HistoryOutlined />}>
              {$fmt('home.restoreSnapshot')} <DownOutlined />
            </Button>
          </Dropdown>
          <Button
            danger
            type="text"
            icon={<DeleteOutlined />}
            title={$fmt('common.delete')}
            onClick={() => remove(record)}
          />
        </Space>
      </div>
    );
  };

  const manualItems = useMemo(
    () =>
      store.manual.map(record => ({
        key: record.id,
        label: renderRecordHeader(record),
        children: (
          <SnapshotEditor
            record={record}
            onSave={async value => {
              await snapshotUtils.update(value);
              $message.success($fmt('snapshots.saved'));
            }}
          />
        ),
      })),
    [store.manual, $fmt, $message, remove, restore],
  );

  const autoItems = useMemo(
    () =>
      store.auto
        ? [
            {
              key: store.auto.id,
              label: renderRecordHeader(store.auto),
              children: (
                <SnapshotEditor
                  record={store.auto}
                  onSave={async value => {
                    await snapshotUtils.update(value);
                    $message.success($fmt('snapshots.saved'));
                  }}
                />
              ),
            },
          ]
        : [],
    [store.auto, $fmt, $message, remove, restore],
  );

  return (
    <StyledSnapshotsPage>
      <div className="snapshot-toolbar">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {$fmt('snapshots.title')}
          </Typography.Title>
        </div>
        <Button
          type="primary"
          icon={<CameraOutlined />}
          loading={loading}
          onClick={() => createSnapshot()}
        >
          {$fmt('snapshots.create')}
        </Button>
      </div>

      <section className="snapshot-section">
        <div className="section-title">
          <Typography.Title level={4} style={{ margin: 0 }}>
            {$fmt('snapshots.manual')}
          </Typography.Title>
          <Typography.Text type="secondary">{store.manual.length} / 50</Typography.Text>
        </div>
        {manualItems.length ? (
          <Collapse items={manualItems} />
        ) : (
          <Empty description={$fmt('snapshots.empty')} />
        )}
      </section>

      <section className="snapshot-section">
        <div className="section-title">
          <Typography.Title level={4} style={{ margin: 0 }}>
            {$fmt('snapshots.auto')}
          </Typography.Title>
        </div>
        {autoItems.length ? (
          <Collapse items={autoItems} />
        ) : (
          <Empty description={$fmt('snapshots.autoEmpty')} />
        )}
      </section>
    </StyledSnapshotsPage>
  );
}
