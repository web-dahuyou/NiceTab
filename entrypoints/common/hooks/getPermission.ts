import { useEffect } from 'react';
import { Modal } from 'antd';
import { checkPermission } from '~/entrypoints/common/utils';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import { stateUtils, settingsUtils } from '~/entrypoints/common/storage';
import { isFirefoxTabGroupSupported as checkFirefoxTabGroupSupported } from '~/entrypoints/common/utils/support';
import { GlobalStateProps, PermissionActionsProps } from '~/entrypoints/types/state';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { updateAdminPageUrlDebounced } from '~/entrypoints/common/tabs';

const {
  UNNAMED_GROUP_RESTORE_AS_GROUP,
  NAMED_GROUP_RESTORE_AS_GROUP,
} = ENUM_SETTINGS_PROPS;

export default function getPermission() {
  const { $fmt } = useIntlUtls();
  const NiceGlobalContext = useContext(GlobalContext);
  const [hasTabGroupsPermission, setHasTabGroupsPermission] = useState(true);
  const [isFirefoxTabGroupSupported, setIsFirefoxTabGroupSupported] = useState(false);

  const setPermissionActionState = async (
    permissionName: keyof PermissionActionsProps,
    value: boolean = true,
  ) => {
    await stateUtils.setStateByModule('global', {
      permissionActions: {
        [permissionName]: value,
      },
    });
  };

  const getTabGroupsPermission = async () => {
    Modal.confirm({
      title: $fmt('common.confirm'),
      content: $fmt('home.getPermission.tabGroups.tip'),
      onOk: async () => {
        try {
          const ok = await browser.permissions.request({ permissions: ['tabGroups'] });
          console.log('tabGroups 权限请求结果：', ok);
          setHasTabGroupsPermission(ok);
          if (ok) {
            const settings = await settingsUtils.getSettings();
            const newSettings = {
              ...settings,
              [UNNAMED_GROUP_RESTORE_AS_GROUP]: true,
              [NAMED_GROUP_RESTORE_AS_GROUP]: true,
            };
            await settingsUtils.setSettings(newSettings);
            NiceGlobalContext.setSettings(newSettings);
            updateAdminPageUrlDebounced();
          }
        } catch (error) {
          console.log('tabGroups 获取权限失败：', error);
        }

        setPermissionActionState('tabGroups', true);
      },
      onCancel: () => {
        setHasTabGroupsPermission(false);
        setPermissionActionState('tabGroups', true);
      },
    });
  };

  const initTabGroupsPermission = async () => {
    if (!import.meta.env.FIREFOX) return;

    const _isFirefoxTabGroupSupported = await checkFirefoxTabGroupSupported();
    setIsFirefoxTabGroupSupported(_isFirefoxTabGroupSupported);
    console.log('Firefox 是否支持 tabGroups', _isFirefoxTabGroupSupported)

    if (!_isFirefoxTabGroupSupported) return;

    const _hasTabGroupsPermission = await checkPermission(['tabGroups']);

    if (!_hasTabGroupsPermission) {
      setHasTabGroupsPermission(false);

      const globalState = await stateUtils.getState('global');
      // 如果弹窗已作回应，则不再自动弹窗
      if (globalState?.permissionActions?.tabGroups) return;
      // 未弹窗或未作回应，则自动弹窗请求授权
      getTabGroupsPermission();
    } else {
      setHasTabGroupsPermission(true);
      setPermissionActionState('tabGroups', true);
    }
  };

  useEffect(() => {
    initTabGroupsPermission();
  }, []);

  return {
    isFirefoxTabGroupSupported,
    hasTabGroupsPermission,
    getTabGroupsPermission,
    initTabGroupsPermission,
  };
}
