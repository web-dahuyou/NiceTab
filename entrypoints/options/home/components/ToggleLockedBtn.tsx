import { useCallback } from 'react';
import { Button } from 'antd';
import { LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';

export default function ToggleLockedBtn({
  isLocked = false,
  onLockStatusChange,
}: {
  isLocked?: boolean;
  onLockStatusChange?: (status: boolean) => void;
}) {
  const { $fmt } = useIntlUtls();

  const handleToggle = useCallback(() => {
    onLockStatusChange?.(!isLocked);
  }, [isLocked]);

  return (
    <div
      className="action-icon"
      title={$fmt(isLocked ? 'home.tag.unlock' : 'home.tag.lock')}
      onClick={handleToggle}
    >
      <Button icon={isLocked ? <UnlockOutlined /> : <LockOutlined />}></Button>
    </div>
  );
}
