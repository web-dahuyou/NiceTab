import { useEffect } from 'react';
import type { VersionInfo } from '~/entrypoints/types';

export default function useUpdate() {
  const [updateDetail, setUpdateDetail] = useState<VersionInfo>({ updateAvailable: false });
  // 立即reload
  const updateReload = useCallback(() => {
    browser.runtime.reload();
  }, []);

  useEffect(() => {
    // 监听是否可升级
    browser.runtime.onUpdateAvailable.addListener((details) => {
      console.log('onUpdateAvailable--details', details);
      setUpdateDetail({ ...details, updateAvailable: true });
    });
  }, []);

  return {
    updateDetail,
    updateReload
  };
};