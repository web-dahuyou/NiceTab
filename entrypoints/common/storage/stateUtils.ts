import type { StateProps } from '~/entrypoints/types';

// 全局状态缓存工具类 （目前只缓存了首页的侧边栏折叠状态，后续看需求添加）
export default class StateUtils {
  initialState = {
    'home:sidebarCollapsed': false,
  };
  state: StateProps = this.initialState;

  setState(state: StateProps) {
    this.state = { ...this.initialState, ...state };
    return localStorage.setItem('local:state', JSON.stringify(this.state));
  }
  getState() {
    try {
      const stateStr = localStorage.getItem('local:state');
      const state = JSON.parse(stateStr || '{}') as StateProps;
      const _savedBefore = !!state;
      this.state = {
        ...this.initialState,
        ...state,
      };
      if (!_savedBefore) {
        this.setState(this.state);
      }
      return this.state;
    } catch {
      return {
        ...this.initialState,
        ...this.state,
      };
    }
  }
}
