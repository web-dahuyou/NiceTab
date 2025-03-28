import type { StateProps, StateModuleProps } from '~/entrypoints/types/state';

// 全局状态缓存工具类 （目前只缓存了首页的状态，后续看需求添加）
export default class StateUtils {
  storageKey: `local:${string}` = 'local:state';
  initialState: StateProps = {
    home: {
      sidebarCollapsed: false,
    },
    global: {
      openedTabsManualSave: [],
      openedTabsAutoSave: [],
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
    moduleState: StateModuleProps<K>
  ) {
    const currState = { ...this.initialState[moduleName], ...this.state[moduleName] };
    this.state[moduleName] = { ...currState, ...moduleState };
    return await storage.setItem<StateProps>(this.storageKey, this.state);
  }
  // 重载签名：不带参数时返回完整状态
  async getState(): Promise<StateProps>;
  // 重载签名：带模块名参数时返回模块类型
  async getState<K extends keyof StateProps>(
    moduleName: K
  ): Promise<StateModuleProps<K>>;
  // 逻辑实现
  async getState<K extends keyof StateProps = 'global'>(
    moduleName?: K
  ): Promise<StateProps | StateModuleProps<K>> {
    const state = await storage.getItem<StateProps>(this.storageKey);
    this.state = { ...this.initialState, ...state };

    if (moduleName) {
      return this.state[moduleName];
    }

    return this.state;
  }
}
