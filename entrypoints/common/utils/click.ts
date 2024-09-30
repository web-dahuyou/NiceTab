type ModifierKeys = 'alt' | 'ctrl' | 'meta' | 'shift';

interface ClickOptions {
  stop?: boolean;
  exact?: boolean;
  allowMissMatch?: boolean; // 是否允许未匹配时执行 handler
  alt?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
}

const shiftKeyFlag = 1;
const altKeyFlag = 1 << 1;
const ctrlKeyFlag = 1 << 2; // macOS 中 control, windows 中 Ctrl
const metaKeyFlag = 1 << 3; // macOS 中 command, windows 中 Win

export const FUNCTION_KEY_FLAGS: Record<ModifierKeys, number> = {
  alt: altKeyFlag,
  ctrl: ctrlKeyFlag,
  meta: metaKeyFlag,
  shift: shiftKeyFlag,
};

export default function clickDecorator(
  handler: ({
    event,
    isMatched,
  }: {
    event: React.MouseEvent;
    isMatched: boolean;
  }) => void,
  options: ClickOptions = {}
) {
  const { stop = false, exact = false, allowMissMatch = false } = options;

  return (event: React.MouseEvent) => {
    if (stop) event.stopPropagation();

    let optionKeyFlag = 0,
      eventKeyFlag = 0;
    const modifierKeys: ModifierKeys[] = ['alt', 'ctrl', 'meta', 'shift'];
    modifierKeys.forEach((key) => {
      optionKeyFlag |= options?.[key] ? FUNCTION_KEY_FLAGS[key] : 0;
      eventKeyFlag |= event?.[`${key}Key`] ? FUNCTION_KEY_FLAGS[key] : 0;
    });

    if (exact && optionKeyFlag !== eventKeyFlag) {
      allowMissMatch && handler?.({ event, isMatched: false });
      return;
    }

    if (optionKeyFlag !== (optionKeyFlag & eventKeyFlag)) {
      allowMissMatch && handler?.({ event, isMatched: false });
      return;
    }

    handler?.({ event, isMatched: true });
  };
}
