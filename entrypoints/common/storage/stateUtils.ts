import type { PageModuleNames } from '~/entrypoints/types';
import type { StateProps } from '~/entrypoints/types/state';

// 全局状态缓存工具类 （目前只缓存了首页的状态，后续看需求添加）
export default class StateUtils {
  storageKey: `local:${string}` = 'local:state';
  initialState: StateProps = {
    home: {
      'sidebarCollapsed': false,
    }
  };
  state: StateProps = this.initialState;

  constructor() {
    this.getState();
  }

  async setState(state: StateProps) {
    this.state = { ...this.initialState, ...state };
    return await storage.setItem<StateProps>(this.storageKey, this.state);
  }
  async setStateByModule(moduleName: PageModuleNames, moduleState: StateProps[PageModuleNames]) {
    const currState = { ...this.initialState[moduleName], ...this.state[moduleName] };
    this.state[moduleName] = { ...currState, ...moduleState };
    return await storage.setItem<StateProps>(this.storageKey, this.state);
  }
  async getState(moduleName?: PageModuleNames) {
    const state = await storage.getItem<StateProps>(this.storageKey);
    this.state = { ...this.initialState, ...state };

    if (moduleName) {
      return this.state[moduleName];
    }

    return this.state;
  }
}
