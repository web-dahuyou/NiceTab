import { useCallback, useRef } from 'react';

export interface GlobalSearchHandle {
  open: () => void;
  close: () => void;
}

export function useGlobalSearchPanel() {
  const globalSearchPanelRef = useRef<GlobalSearchHandle>(null);

  const open = useCallback(async () => {
    globalSearchPanelRef.current?.open?.();
  }, []);
  const close = useCallback(async () => {
    globalSearchPanelRef.current?.close?.();
  }, []);

  return {
    globalSearchPanelRef,
    open,
    close,
  };
}
