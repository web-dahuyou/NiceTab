import type { StateProps, StateModuleProps } from '~/entrypoints/types/state';

// 全局状态缓存工具类 （目前只缓存了首页的状态，后续看需求添加）
export default class StateUtils {
  storageKey: `local:${string}` = 'local:state';
  initialState: StateProps = {
    home: {
      sidebarCollapsed: false,
      selectedKeysStore: [],
    },
    global: {
      permissionActions: {
        tabGroups: false,
      },
      snapshotStatus: 'on', // on/off
      openedTabsManualSave: [],
      openedTabsAutoSave: [],
      lastSelectedTargetValue: ['0'],
    },
  };
  state: StateProps = this.initialState;

  constructor() {
    this.getState();
  }

  async setState(state: StateProps) {
    this.state = { ...this.initialState, ...state };
    return await storage.setItem<StateProps>(this.storageKey, this.state);
  }
  async setStateByModule<K extends keyof StateProps = 'global'>(
    moduleName: K,
    moduleState: StateModuleProps<K>,
  ) {
    await this.getState();
    const currState = { ...this.initialState[moduleName], ...this.state[moduleName] };
    this.state[moduleName] = { ...currState, ...moduleState };
    return await storage.setItem<StateProps>(this.storageKey, this.state);
  }
  // 重载签名：不带参数时返回完整状态
  async getState(): Promise<StateProps>;
  // 重载签名：带模块名参数时返回模块类型
  async getState<K extends keyof StateProps>(moduleName: K): Promise<StateModuleProps<K>>;
  // 逻辑实现
  async getState<K extends keyof StateProps = 'global'>(
    moduleName?: K,
  ): Promise<StateProps | StateModuleProps<K>> {
    const state = await storage.getItem<StateProps>(this.storageKey);
    this.state = { ...this.initialState, ...state };

    if (moduleName) {
      return this.state[moduleName] || {};
    }

    return this.state;
  }

  /* 具体业务逻辑 */
  // 获取首页选中的分类和标签组（当前窗口）
  async getHomeSelectedKeys() {
    const allWindows = await browser.windows.getAll({ windowTypes: ['normal'] });
    const currWindow = await browser.windows.getCurrent();
    const homeState = await this.getState('home');
    const currItem = homeState.selectedKeysStore?.find(
      item => item.windowId === currWindow.id,
    );
    if (!allWindows || !currWindow || allWindows.length === 1) {
      return currItem || homeState.selectedKeysStore?.[0] || {};
    }
    return currItem || {};
  }
  // 保存首页选中的分类和标签组（当前窗口）
  async saveHomeSelectedKeys(
    {
      selectedTagKey,
      selectedTabGroupKey,
    }: {
      selectedTagKey?: string;
      selectedTabGroupKey?: string;
    },
    callback?: () => void,
  ) {
    const currWindow = await browser.windows.getCurrent();
    const selectedKeysInfo = {
      windowId: currWindow.id,
      selectedTagKey,
      selectedTabGroupKey,
    };
    const homeState = await this.getState('home');
    if (!homeState.selectedKeysStore) {
      homeState.selectedKeysStore = [];
    }
    const savedInfoIdx = homeState.selectedKeysStore.findIndex(
      item => item.windowId === currWindow.id,
    );
    if (~savedInfoIdx) {
      homeState.selectedKeysStore[savedInfoIdx] = selectedKeysInfo;
    } else {
      homeState.selectedKeysStore.push(selectedKeysInfo);
    }
    await this.setStateByModule('home', homeState);
    callback?.();
    this.clearSelectedKeysOfInvalidWindows();
  }
  async clearSelectedKeysOfInvalidWindows() {
    const allWindows = await browser.windows.getAll();
    const windowIds = new Set(allWindows.map(item => item.id));
    const homeState = await this.getState('home');
    homeState.selectedKeysStore = homeState.selectedKeysStore?.filter(item => {
      return windowIds.has(item.windowId);
    });
    this.setStateByModule('home', homeState);
  }
}
