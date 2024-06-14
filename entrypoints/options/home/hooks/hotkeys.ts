import { useEffect, useCallback, useMemo } from "react";
import hotkeys from 'hotkeys-js';
import { useIntlUtls } from '~/entrypoints/common/hooks';
import { getKeysByOS } from '~/entrypoints/common/utils';

const keyMap = getKeysByOS();

const hotkeyOptions = () => ([
  { key: 'shift+up', action: 'moveUp' },
  { key: 'shift+down', action: 'moveDown' },
]);

const getSymbols = (key: string, splitKey: string = '+') => {
  const splitKeys = key.split(splitKey);
  return splitKeys.map(key => keyMap?.[key]?.symbol || key);
}

export default function useListHotkeys ({ onAction }: { onAction: (params: { action: string }) => void }) {
  const { $fmt } = useIntlUtls();
  const hotkeyList = useMemo(() => {
    return hotkeyOptions().map((item) => {
      return {
        key: item.key,
        combo: getSymbols(item.key),
        action: item.action,
        label: $fmt(`common.${item.action}`),
      }
    })
  }, []);

  const hotkeyRegister = useCallback(() => {
    console.log('hotkeyList', hotkeyList);
    hotkeyList.forEach((item) => {
      hotkeys.unbind(item.key, 'tagList');
      hotkeys(item.key, {scope: 'tagList'}, (event, handler) => {
        // console.log('hotkeys--event', event)
        // console.log('hotkeys--handler', handler)
        onAction({ action: item.action });
      });
      hotkeys.setScope('tagList');
    });
  }, [hotkeyList, onAction]);

  useEffect(() => {
    hotkeyRegister();
  }, [onAction]);

  useEffect(() => {
    return () => {
      hotkeys.unbind();
    }
  }, []);

  return {
    hotkeyList,
    hotkeyRegister
  };
}