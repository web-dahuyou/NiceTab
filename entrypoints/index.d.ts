declare module 'react-copy-to-clipboard' {
  type CopyToClipboardProps = {
    value: string;
    onCopy: (text: string, result: boolean) => void;
    children: JSX.Element
  }
  export function CopyToClipboard(props: CopyToClipboardProps): JSX.Element
};

declare module 'file-saver' {
  export function saveAs(blob: Blob, name?: string): void
};

export default {
  name: 'Nice-Tab.d.ts',
}