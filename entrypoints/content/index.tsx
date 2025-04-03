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
        const wrapper = document.createElement('div');
        wrapper.id = 'nicetab-shadow-root-wrapper';
        container.append(wrapper);

        const root = ReactDOM.createRoot(wrapper);
        // root.render(<App />);
        root.render(
          <StyleProvider container={container}>
            <Root pageContext="contentScriptPage">
              <StyleSheetManager target={container}>
                <ContentGlobalContext.Provider value={{ rootWrapper: wrapper }}>
                  <App />
                </ContentGlobalContext.Provider>
              </StyleSheetManager>
            </Root>
          </StyleProvider>
        );
        return { root, wrapper };
      },
      onRemove: (elements) => {
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
