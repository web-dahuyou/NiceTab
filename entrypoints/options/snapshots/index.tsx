import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Drawer,
  Dropdown,
  Empty,
  Menu,
  Modal,
  Space,
  Typography,
  Tooltip,
  theme,
  type MenuProps,
} from 'antd';
import {
  CameraOutlined,
  DeleteOutlined,
  DownOutlined,
  HistoryOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import {
  initSnapshotStorageListener,
  initScheduledSnapshotStorageListener,
  snapshotUtils,
} from '~/entrypoints/common/storage';
import { saveOpenedTabsAsSnapshot } from '~/entrypoints/common/tabs';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import type {
  ScheduledSnapshot,
  SnapshotRecord,
  SnapshotStore,
} from '~/entrypoints/types';
import { classNames } from '~/entrypoints/common/utils';
import { requestSnapshotAction } from '~/entrypoints/common/utils/runtimeMsg';
import { MAX_MANUAL_SNAPSHOTS } from '~/entrypoints/common/storage/snapshotUtils';
import EditInput from '~/entrypoints/options/components/EditInput';
import SnapshotDetails from './SnapshotDetails';
import {
  StyledMainWrapper,
  StyledSidebarWrapper,
  StyledSnapshotContent,
} from './Snapshots.styled';

const emptyStore: SnapshotStore = { version: 2, manual: [] };

type ListedSnapshot = SnapshotRecord | ScheduledSnapshot;

function getStats(record: ListedSnapshot) {
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
  const { token } = theme.useToken();
  const [modal, contextHolder] = Modal.useModal();
  const [store, setStore] = useState<SnapshotStore>(emptyStore);
  const [scheduled, setScheduled] = useState<ScheduledSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState<ListedSnapshot['source']>('manual');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [detailRecord, setDetailRecord] = useState<ListedSnapshot>();

  const recordsBySource = useMemo(
    () => ({
      manual: store.manual,
      scheduled,
      auto: store.auto ? [store.auto] : [],
    }),
    [store, scheduled],
  );

  const loadStore = useCallback(async () => {
    setStore({ ...(await snapshotUtils.getStore()) });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStore();
    return initSnapshotStorageListener(loadStore);
  }, [loadStore]);

  useEffect(() => {
    let active = true;
    let updated = false;
    const unwatch = initScheduledSnapshotStorageListener(records => {
      updated = true;
      setScheduled(records);
    });
    snapshotUtils.getScheduled().then(records => {
      if (active && !updated) setScheduled(records);
    });
    return () => {
      active = false;
      unwatch();
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia('(max-width: 840px)').matches) setSidebarCollapsed(true);
  }, []);

  useEffect(() => {
    if (!detailRecord) return;

    const records = recordsBySource[detailRecord.source];
    const record =
      detailRecord.source === 'auto'
        ? records[0]
        : records.find(item => item.id === detailRecord.id);

    if (!record) {
      setDetailRecord(undefined);
    } else if (record !== detailRecord) setDetailRecord(record);
  }, [recordsBySource, detailRecord]);

  const createSnapshot = useCallback(async () => {
    const result = await saveOpenedTabsAsSnapshot('manualSave');
    if (result?.saved) $message.success($fmt('snapshots.created'));
  }, [$fmt, $message]);

  const restore = useCallback(
    async (record: ListedSnapshot, mode: 'newWindow' | 'replaceCurrent') => {
      const execute = async () => {
        const action = $fmt('home.restoreSnapshot');
        try {
          const result = await requestSnapshotAction({
            action: 'restore',
            id: record.id,
            source: record.source,
            mode,
          });
          if (result.status === 'success') {
            $message.success($fmt({ id: 'common.actionSuccess', values: { action } }));
            return;
          }
          // if (result.status === 'partial') {
          //   $message.warning($fmt('snapshots.restorePartial'));
          //   return;
          // }
        } catch (error) {
          console.warn('Unable to request snapshot restore', error);
        }
        $message.error($fmt({ id: 'common.actionFailed', values: { action } }));
      };
      if (mode === 'replaceCurrent') {
        modal.confirm({
          title: $fmt('common.confirmReminder'),
          content: $fmt('snapshots.restoreCurrentConfirm'),
          onOk: execute,
        });
      } else {
        await execute();
      }
    },
    [$fmt, $message, modal],
  );

  const remove = useCallback(
    (record: SnapshotRecord) => {
      modal.confirm({
        title: $fmt('common.confirmReminder'),
        content: $fmt('snapshots.deleteConfirm'),
        onOk: () => snapshotUtils.remove(record.id, record.source),
      });
    },
    [$fmt],
  );

  const rename = useCallback(async (record: SnapshotRecord, newName: string) => {
    const normalized = newName.trim();
    if (!normalized || normalized === record.name) return;
    await snapshotUtils.update({ ...record, name: normalized });
  }, []);

  const renderRecord = (record: ListedSnapshot) => {
    const stats = getStats(record);
    const restoreItems: MenuProps['items'] = [
      {
        key: 'newWindow',
        label: $fmt('snapshots.restoreNewWindow'),
        onClick: () => restore(record, 'newWindow'),
      },
      {
        key: 'replaceCurrent',
        label: $fmt('snapshots.restoreCurrentWindow'),
        danger: true,
        onClick: () => restore(record, 'replaceCurrent'),
      },
    ];
    return (
      <div className="snapshot-record" key={record.id}>
        <div className="snapshot-heading">
          <div className="snapshot-name">
            {record.source === 'manual' ? (
              <EditInput
                value={record.name}
                maxLength={80}
                onValueChange={value => rename(record, value || '')}
              />
            ) : (
              record.name
            )}
          </div>
          <div className="snapshot-meta">
            {record.source === 'scheduled' ? record.createdAt : record.updatedAt} ·{' '}
            {$fmt({ id: 'snapshots.stats', values: stats })}
          </div>
        </div>
        <Space className="snapshot-actions" wrap>
          <Button onClick={() => setDetailRecord(record)}>{$fmt('common.view')}</Button>
          <Dropdown menu={{ items: restoreItems }}>
            <Button icon={<HistoryOutlined />}>
              {$fmt('home.restoreSnapshot')} <DownOutlined />
            </Button>
          </Dropdown>
          {record.source === 'manual' && (
            <Button
              danger
              type="text"
              icon={<DeleteOutlined />}
              title={$fmt('common.delete')}
              onClick={() => remove(record)}
            />
          )}
        </Space>
      </div>
    );
  };

  const records = recordsBySource[module];
  const sidebarItems: MenuProps['items'] = useMemo(
    () => [
      { key: 'manual', label: $fmt('snapshots.manual') },
      { key: 'scheduled', label: $fmt('snapshots.scheduled') },
      { key: 'auto', label: $fmt('snapshots.auto') },
    ],
    [$fmt],
  );

  return (
    <StyledMainWrapper
      className={classNames('snapshot-page', sidebarCollapsed && 'collapsed')}
      style={
        {
          '--sidebar-grid-col': `${sidebarCollapsed ? 0 : sidebarWidth}px`,
          '--right-panel-grid-col': '0px',
        } as React.CSSProperties
      }
    >
      {contextHolder}
      <StyledSidebarWrapper
        className="sidebar"
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
            onClick={({ key }) => setModule(key as ListedSnapshot['source'])}
          />
        }
      />
      <StyledSnapshotContent className="main-content-wrapper">
        <div className="snapshot-header">
          <Space align="center">
            <Typography.Title level={5} style={{ margin: 0 }}>
              {$fmt(`snapshots.${module}`)}
            </Typography.Title>

            {module === 'manual' && (
              <Tooltip
                color={token.colorBgElevated}
                placement="bottom"
                destroyTooltipOnHide
                title={<Typography.Text>{$fmt('snapshots.tip.list')}</Typography.Text>}
              >
                <QuestionCircleOutlined />
              </Tooltip>
            )}
          </Space>
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
              description={$fmt(
                module === 'auto' ? 'snapshots.autoEmpty' : 'snapshots.empty',
              )}
              styles={{ root: { paddingTop: '80px' } }}
            />
          )}
        </div>
      </StyledSnapshotContent>
      <Drawer
        title={detailRecord?.name}
        width={720}
        open={!!detailRecord}
        destroyOnClose
        onClose={() => setDetailRecord(undefined)}
      >
        {detailRecord?.source === 'scheduled' && (
          <p>
            {$fmt({ id: 'snapshots.windowId', values: { id: detailRecord.windowId } })}
          </p>
        )}
        {detailRecord && <SnapshotDetails record={detailRecord} />}
      </Drawer>
    </StyledMainWrapper>
  );
}
