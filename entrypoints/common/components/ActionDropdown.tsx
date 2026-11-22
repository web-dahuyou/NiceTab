import { Dropdown, type MenuProps } from 'antd';

export default function ActionDropdown({
  items,
  label,
  disabled,
  children,
}: {
  items: NonNullable<MenuProps['items']>;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Dropdown
      disabled={disabled}
      trigger={['click']}
      menu={{ items }}
      getPopupContainer={node => {
        const root = node.getRootNode();
        return root instanceof ShadowRoot
          ? (root.querySelector<HTMLElement>('#nicetab-shadow-root-wrapper') ??
              node.parentElement!)
          : document.body;
      }}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        style={{
          background: 'transparent',
          border: 0,
          color: 'inherit',
          cursor: 'pointer',
          padding: 0,
          font: 'inherit',
          display: 'flex',
          alignItems: 'center',
        }}
        onMouseDown={e => e.preventDefault()}
        onClick={e => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {children}
      </button>
    </Dropdown>
  );
}
