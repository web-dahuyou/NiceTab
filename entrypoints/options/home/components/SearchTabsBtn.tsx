import { Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { eventEmitter, useIntlUtls } from '~/entrypoints/common/hooks/global';

export default function SearchTabsBtn() {
  const { $fmt } = useIntlUtls();

  const openGlobalSearchPanel = () => {
    eventEmitter.emit('global:open-global-search-modal');
  };

  return (
    <div
      className="action-icon"
      title={$fmt({
        id: 'home.searchTabAndUrl',
      })}
      onClick={openGlobalSearchPanel}
    >
      <Button icon={<SearchOutlined />}></Button>
    </div>
  );
}
