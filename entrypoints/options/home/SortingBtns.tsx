import { type ReactNode, useMemo } from 'react';
import { Button } from 'antd';
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
  // ArrowUpOutlined,
  // ArrowDownOutlined,
} from '@ant-design/icons';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import {
  IconTimeAscending,
  IconTimeDescending,
} from '~/entrypoints/common/components/icon/CustomIcon';

export default function SortingBtns({
  sortBy = 'name',
  onSort,
}: {
  sortBy?: string;
  onSort?: (type: string) => void;
}) {
  const { $fmt } = useIntlUtls();
  const config = useMemo(() => {
    if (sortBy === 'name') {
      return {
        ascending: {
          title: $fmt({
            id: 'common.ascending',
            values: { sortBy: $fmt('home.tabGroup.name') },
          }),
          icon: <SortAscendingOutlined />,
        },
        descending: {
          title: $fmt({
            id: 'common.descending',
            values: { sortBy: $fmt('home.tabGroup.name') },
          }),
          icon: <SortDescendingOutlined />,
        },
      };
    } else if (sortBy === 'createTime') {
      return {
        ascending: {
          title: $fmt({
            id: 'common.ascending',
            values: { sortBy: $fmt('home.tabGroup.createTime') },
          }),
          icon: <IconTimeAscending />,
        },
        descending: {
          title: $fmt({
            id: 'common.descending',
            values: { sortBy: $fmt('home.tabGroup.createTime') },
          }),
          icon: <IconTimeDescending />,
        },
      };
    }
  }, [$fmt]);

  return (
    <>
      <div
        className="action-icon"
        title={config?.ascending?.title || $fmt('common.ascending')}
        onClick={() => onSort?.('ascending')}
      >
        <Button icon={config?.ascending?.icon || <SortAscendingOutlined />}></Button>
      </div>
      <div
        className="action-icon"
        title={config?.descending?.title || $fmt('common.descending')}
        onClick={() => onSort?.('descending')}
      >
        <Button icon={config?.descending?.icon || <SortDescendingOutlined />}></Button>
      </div>
    </>
  );
}
