import { Button } from 'antd';
import { SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';

export default function SortingBtns({ onSort }: { onSort?: (type: string) => void }) {
  const { $fmt } = useIntlUtls();

  return <>
    <div
      className="action-icon"
      title={$fmt('common.ascending')}
      onClick={() => onSort?.('ascending')}
    >
      <Button icon={<SortAscendingOutlined />}></Button>
    </div>
    <div
      className="action-icon"
      title={$fmt('common.descending')}
      onClick={() => onSort?.('descending')}
    >
      <Button icon={<SortDescendingOutlined />}></Button>
    </div>
  </>;
}
