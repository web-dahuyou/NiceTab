import ReactDOM from 'react-dom/client';
import '~/assets/css/reset.css';
import './style.css';
import App from './App';

export default defineContentScript({
  // "matches": ['<all_urls>'],
  matches: ["*://*/*"],
  cssInjectionMode: "ui",
  // cssInjectionMode: 'manual',

  async main(ctx) {
    console.log('content-script: Hello Nice-Tab.');
    // createShadowRootUi 方式
    const ui = await createShadowRootUi(ctx, {
      name: "nicetab-message",
      position: "modal",
      anchor: "body",
      // append: "first",
      onMount: (container) => {
        const wrapper = document.createElement("div");
        container.append(wrapper);

        const root = ReactDOM.createRoot(wrapper);
        root.render(<App />);
        return { root, wrapper };
      },
      onRemove: (elements) => {
        elements?.root.unmount();
        elements?.wrapper.remove();
      },
    });

    // createIntegratedUi 方式
    // const ui = await createIntegratedUi(ctx, {
    //   position: "inline",
    //   anchor: "body",
    //   append: "first",
    //   onMount: (container) => {
    //     const wrapper = document.createElement("div");
    //     container.append(wrapper);

    //     const root = ReactDOM.createRoot(wrapper);
    //     root.render(<App />);
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
