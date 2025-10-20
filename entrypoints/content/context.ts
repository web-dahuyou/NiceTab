import { createContext } from 'react';

type GlobalContextProps = {
  rootWrapper: HTMLElement;
};

export const ContentGlobalContext = createContext<GlobalContextProps>({
  rootWrapper: document.body,
});
