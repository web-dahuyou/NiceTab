import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import type { FormInstance } from 'antd';
import { Form, Checkbox, Typography } from 'antd';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import {
  ENUM_SETTINGS_PROPS,
  ENUM_ACTION_NAME,
  defaultContextmenuConfigList,
} from '~/entrypoints/common/constants';
import { getBaseMenuMap } from '~/entrypoints/common/contextMenus';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import type { SettingsProps, ContextMenuConfigItem } from '~/entrypoints/types';
import { omit } from '~/entrypoints/common/utils';
import DndComponent from '~/entrypoints/common/components/DndComponent';

const { CONTEXT_MENU_CONFIG } = ENUM_SETTINGS_PROPS;

const StyledListWrapper = styled.div`
  .contextmenu-checkbox-group {
    width: 100%;
    display: block;
  }
`;

const dndKey = Symbol('context-menu-item');

type Props = {
  form: FormInstance<SettingsProps>;
  value?: ContextMenuConfigItem[];
  onChange?: (v: ContextMenuConfigItem[]) => void;
};

// 拖拽menu item 数据
export type DndMenuItemProps = {
  menuId: string;
  index: number;
  dndKey: symbol;
};
export type DndMenuItemPropCallback = ({
  sourceData,
  targetData,
  sourceIndex,
  targetIndex,
}: {
  sourceData: DndMenuItemProps;
  targetData: DndMenuItemProps;
  sourceIndex: number;
  targetIndex: number;
}) => void;

export default function ContextMenuConfig({ form }: Props) {
  const { locale } = useIntlUtls();

  const contextMenuConfig = Form.useWatch(CONTEXT_MENU_CONFIG, form);

  const [list, setList] = useState<ContextMenuConfigItem[]>([]);
  const selectedTabIds = useMemo(() => {
    return list.filter(item => item.display).map(item => item.menuId);
  }, [list]);

  const getNamedList = useCallback(async () => {
    // 基础菜单map
    const baseMenuMap = await getBaseMenuMap();
    const contextMenuConfigMap = (contextMenuConfig || []).reduce<
      Partial<Record<ENUM_ACTION_NAME, ContextMenuConfigItem>>
    >(
      (acc, item) => ({
        ...acc,
        [item.menuId]: item,
      }),
      {},
    );

    // 由于新版本迭代可能会新增菜单项，不在历史偏好设置中，需要判断差异并添加到配置项
    const _list: ContextMenuConfigItem[] = (contextMenuConfig || []).map(item => {
      const baseMenu = baseMenuMap[item.menuId] || {};
      return {
        ...item,
        name: baseMenu.title,
      };
    });

    defaultContextmenuConfigList.forEach(item => {
      const baseMenu = baseMenuMap[item.menuId] || {};
      const savedConfigItem = contextMenuConfigMap[item.menuId];
      if (!savedConfigItem) {
        _list.push({ ...item, display: false, name: baseMenu.title });
      }
    });

    setList(_list);
  }, [contextMenuConfig]);

  // 选中的 menu item 变化
  const handleSelectedChange = useCallback(
    (ids: string[]) => {
      const _list = list.map(item => ({
        ...item,
        display: ids.includes(item.menuId),
      }));
      setList(_list);

      form.setFieldsValue({
        [CONTEXT_MENU_CONFIG]: _list.map(item => omit(item, ['name'])),
      });
    },
    [list],
  );

  // 拖拽排序
  const handleMenuItemDrop: DndMenuItemPropCallback = useCallback(
    async ({ sourceData, targetData, sourceIndex, targetIndex }) => {
      const _list = reorderWithEdge({
        startIndex: sourceData.index,
        indexOfTarget: targetData.index,
        list: list,
        axis: 'vertical',
        closestEdgeOfTarget: extractClosestEdge(targetData),
      });
      console.log('_list', _list);
      setList(_list);

      form.setFieldsValue({
        [CONTEXT_MENU_CONFIG]: _list.map(item => omit(item, ['name'])),
      });
    },
    [list],
  );

  useEffect(() => {
    getNamedList();
  }, [contextMenuConfig, locale]);

  return (
    <StyledListWrapper>
      <Checkbox.Group
        className="contextmenu-checkbox-group"
        value={selectedTabIds}
        onChange={handleSelectedChange}
      >
        {list.map((item, index) => (
          <DndComponent<DndMenuItemProps>
            key={item.menuId}
            dndKey={dndKey}
            canDrag={true}
            mainField="menuId"
            data={{ index, menuId: item.menuId, dndKey }}
            onDrop={handleMenuItemDrop}
          >
            <div className="contextmenu-checkbox">
              <Checkbox value={item.menuId}>
                <Typography.Text>{item.name}</Typography.Text>
              </Checkbox>
            </div>
          </DndComponent>
        ))}
      </Checkbox.Group>
    </StyledListWrapper>
  );
}
