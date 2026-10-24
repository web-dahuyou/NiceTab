import ReactDOM from 'react-dom/client';
import { StyleProvider } from '@ant-design/cssinjs';
import { StyleSheetManager } from 'styled-components';
import '~/assets/css/reset.css';
import './style.css';
import { ContentGlobalContext } from './context';
import Root from '~/entrypoints/common/components/Root';
import App from './App';

export default defineContentScript({
  // "matches": ['<all_urls>'],
  matches: ['*://*/*'],
  cssInjectionMode: 'ui',
  // cssInjectionMode: 'manual',

  async main(ctx) {
    // console.log('content-script: Hello Nice-Tab.');
    // createShadowRootUi 方式
    const ui = await createShadowRootUi(ctx, {
      name: 'nicetab-message',
      position: 'modal',
      anchor: 'body',
      // append: "first",
      onMount: (container, shadow, shadowHost) => {
        shadowHost.style.zIndex = '99999';
        /*
        在 onMount 中给 shadowHost 添加 visibility: visible。
        原因：某些网站 (如 reddit.com 页面的 CSS 设置了类似 visibility: hidden 的样式，<nicetab-message> 作为自定义元素继承了这个属性。WXT 的 applyPosition 函数没有设置 visibility，所以继承值导致整个内容脚本 UI 不可见。
        通过内联样式 visibility: visible 显式覆盖继承值。内联样式的优先级高于继承值和外部 CSS，确保 shadowHost 始终可见。
        */
        shadowHost.style.visibility = 'visible';
        const wrapper = document.createElement('div');
        wrapper.id = 'nicetab-shadow-root-wrapper';
        container.append(wrapper);

        const root = ReactDOM.createRoot(wrapper);
        // root.render(<App />);
        root.render(
          <StyleProvider container={container}>
            <Root pageContext="contentScriptPage" messageContainer={container}>
              <StyleSheetManager target={container}>
                <ContentGlobalContext.Provider value={{ rootWrapper: wrapper }}>
                  <App />
                </ContentGlobalContext.Provider>
              </StyleSheetManager>
            </Root>
          </StyleProvider>,
        );
        return { root, wrapper };
      },
      onRemove: elements => {
        elements?.root.unmount();
        elements?.wrapper.remove();
      },
    });

    // createIntegratedUi 方式
    // const ui = await createIntegratedUi(ctx, {
    //   position: 'modal',
    //   anchor: 'body',
    //   // append: "first",
    //   onMount: (container) => {
    //     const wrapper = document.createElement('div');
    //     container.append(wrapper);

    //     const root = ReactDOM.createRoot(wrapper);
    //     // root.render(<App />);
    //     root.render(
    //       <Root pageContext="contentScriptPage">
    //         <App />
    //       </Root>
    //     );
    //     return { root, wrapper };
    //   },
    //   onRemove: (elements) => {
    //     elements?.root.unmount();
    //     elements?.wrapper.remove();
    //   },
    // });

    ui.mount();
  },
});
