import { FloatButton } from 'antd';
import type { RefSelectProps } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useIntlUtls } from '~/entrypoints/common/hooks/global'
import SearchList from './footer/SearchList';

export default function FooterFloatButton() {
  const { $fmt } = useIntlUtls();
  const searchSelectRef = useRef<RefSelectProps>(null);

  return (
    <FloatButton.Group
        trigger="click"
        placement="left"
        shape="circle"
        style={{ right: 30, bottom: 30 }}
        icon={<span title={$fmt('home.searchTabAndUrl')}><SearchOutlined /></span>}
        onClick={() => {
          setTimeout(() => {
            searchSelectRef.current?.focus();
          }, 300);
        }}
      >
        <SearchList ref={searchSelectRef}></SearchList>
      </FloatButton.Group>
  )
}