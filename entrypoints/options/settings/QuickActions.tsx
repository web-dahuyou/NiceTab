import { Space, Button, Typography } from 'antd';
import styled from 'styled-components';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';

const StyledButton = styled(Button)`
  display: flex;
  align-items: center;
  padding: 0;
`;

const templateMap = {
  1: '{{url}} | {{title}}',
  2: '{{title}}: {{url}}',
  3: '[{{title}}]({{url}})',
};

export default function QuickActions({ onChange }: { onChange: (type: string) => void }) {
  const { $fmt } = useIntlUtls();

  return (
    <Space>
      <Typography.Text mark>{$fmt('common.quickAction')}</Typography.Text>
      <StyledButton type="link" onClick={() => onChange(templateMap[1])}>
        <Typography.Text code>{$fmt('common.url')} | {$fmt('common.title')}</Typography.Text>
      </StyledButton>
      <StyledButton type="link" onClick={() => onChange(templateMap[2])}>
        <Typography.Text code>{$fmt('common.title')}: {$fmt('common.url')}</Typography.Text>
      </StyledButton>
      <StyledButton type="link" onClick={() => onChange(templateMap[3])}>
        <Typography.Text code>[{$fmt('common.title')}]({$fmt('common.url')})</Typography.Text>
      </StyledButton>
    </Space>
  );
}
