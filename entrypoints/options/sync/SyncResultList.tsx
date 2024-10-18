import { theme, Flex, Space, Alert, Empty, Tooltip, Typography } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import type { SyncResultItemProps } from '~/entrypoints/types';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { SUCCESS_KEY } from '~/entrypoints/common/constants';
import { StyledLabel } from './Sync.styled';
import { useSyncResult } from './hooks/syncResult';

type SyncResultListProps = {
  resultList: SyncResultItemProps[];
};

export default function SyncResultList({ resultList }: SyncResultListProps) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();

  const { syncTypeTextMap, syncTypeTipMap } = useSyncResult();

  if (!resultList?.length) {
    return (
      <div style={{ paddingTop: '160px' }}>
        <Empty description={$fmt('sync.noSyncHistory')}></Empty>
      </div>
    );
  }

  return (
    <Flex vertical gap={12}>
      <Space align="center">
        <Typography.Title level={5} style={{ margin: 0 }}>{$fmt('sync.syncHistory')}</Typography.Title>
        <Tooltip
          color={token.colorBgElevated}
          placement="bottom"
          destroyTooltipOnHide
          title={
            <Typography.Text>{ $fmt('sync.tip.syncHistory') }</Typography.Text>
          }
        >
          <QuestionCircleOutlined />
        </Tooltip>
      </Space>
      {resultList.map((result) => (
        <Alert
          key={result.syncTime}
          message={
            <Flex vertical gap={2}>
              <Typography.Text type="secondary">
                <StyledLabel>{$fmt('sync.syncType')}: </StyledLabel>
                <Tooltip
                  color={token.colorBgElevated}
                  destroyTooltipOnHide
                  title={
                    <Typography.Text>{syncTypeTipMap[result.syncType]}</Typography.Text>
                  }
                >
                  <Typography.Text strong>
                    {syncTypeTextMap[result.syncType]}
                  </Typography.Text>
                </Tooltip>
              </Typography.Text>
              <Typography.Text type="secondary">
                <StyledLabel>{$fmt('sync.syncTime')}: </StyledLabel>
                {result.syncTime || $fmt('common.noData')}
              </Typography.Text>
              {result.reason && (
                <Typography.Text type="danger">
                  <StyledLabel>{$fmt('common.failedReason')}: </StyledLabel>
                  {$fmt(`sync.reason.${result.reason}`)}
                </Typography.Text>
              )}
            </Flex>
          }
          type={result.syncResult === SUCCESS_KEY ? 'success' : 'error'}
          showIcon
        ></Alert>
      ))}
    </Flex>
  );
}
