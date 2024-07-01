import { Flex, Table } from 'antd';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import styled from 'styled-components';
import type { HotkeyItem } from '~/entrypoints/types';

const StyledTableWrapper = styled.div`
  .hotkey-key {
    padding: 2px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
`;

const { Column } = Table;

export default function HotkeyList({ list }: { list: HotkeyItem[] }) {
  const { $fmt } = useIntlUtls();

  return (
    <StyledTableWrapper>
      <Table className="hotkey-table" dataSource={list} size="middle" bordered pagination={false}>
        <Column title={$fmt('hotkeys.keyName')} dataIndex="combo" key="combo" render={(combo: string[]) => (
          <Flex gap={8}>
            {combo.map((keyString: string) => <span className="hotkey-key" key={keyString}>{keyString}</span>)}
          </Flex>
        )}></Column>
        <Column title={$fmt('hotkeys.desc')} dataIndex="label" key="label"></Column>
      </Table>
    </StyledTableWrapper>
  )
}