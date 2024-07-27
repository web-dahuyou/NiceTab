import { useEffect, useCallback, useMemo } from "react";
import hotkeys from 'hotkeys-js';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { getOSInfo, getKeysByOS } from '~/entrypoints/common/utils';
import type { HotkeyOption } from '~/entrypoints/types';

const osInfo = getOSInfo();
const keyMap = getKeysByOS();

const hotkeyOptions = [
  { macKey: 'shift+option+up', winKey: 'shift+alt+up', action: 'moveUp' },
  { macKey: 'shift+option+down', winKey: 'shift+alt+down', action: 'moveDown' },
];

const getSymbols = (option: HotkeyOption, splitKey: string = '+') => {
  const key = osInfo.isMac ? option.macKey : option.winKey;
  const splitKeys = key.split(splitKey);
  return splitKeys.map(key => keyMap?.[key]?.symbol || key);
}

export default function useListHotkeys ({ onAction }: { onAction?: (params: { action: string }) => void }) {
  const { $fmt } = useIntlUtls();
  const hotkeyList = useMemo(() => {
    return hotkeyOptions.map((item) => {
      return {
        ...item,
        key: osInfo.isMac ? item.macKey : item.winKey,
        combo: getSymbols(item),
        label: $fmt(`common.${item.action}`),
      }
    })
  }, []);

  const hotkeyRegister = useCallback(() => {
    // console.log('hotkeyList', hotkeyList);
    hotkeyList.forEach((item) => {
      hotkeys.unbind(item.key, 'tagList');
      hotkeys(item.key, {scope: 'tagList'}, (event, handler) => {
        // console.log('hotkeys--event', event)
        // console.log('hotkeys--handler', handler)
        onAction?.({ action: item.action });
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