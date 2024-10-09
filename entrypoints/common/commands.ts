import { Commands } from 'wxt/browser';
import tabUtils from '~/entrypoints/common/tabs';
import { actionHandler } from './contextMenus';

export default async function commandsRegister() {
  async function checkCommandShortcuts() {
    const commands = await browser.commands.getAll();
    console.log('checkCommandShortcuts--commands', commands);
    let availableShortcuts: Commands.Command[] = [];
    let missingShortcuts: Commands.Command[] = [];

    for (let command of commands) {
      if (command.name !== '_execute_action' && command.shortcut === '') {
        missingShortcuts.push(command);
      } else {
        availableShortcuts.push(command);
      }
    }

    if (missingShortcuts.length > 0) {
      console.log('Commands with missing shortcuts:', missingShortcuts);
    }
  }

  checkCommandShortcuts();

  // browser.runtime.onInstalled.addListener((details) => {
  //   if (details.reason === 'install') {
  //     checkCommandShortcuts();
  //   }
  // });

  browser.commands.onCommand.addListener(async (command) => {
    console.log(`Command "${command}" triggered`);
    try {
      await actionHandler(command);
      tabUtils.executeContentScript(command);
    } catch (error) {
      console.error(error);
      tabUtils.executeContentScript(command, 'error');
    }
  });
}

// 获取扩展快捷键映射
export async function getCommandsHotkeys() {
  const commands = await browser.commands.getAll();

  const hotkeysMap = new Map<Commands.Command['name'], string | undefined>();
  commands.forEach((command) => {
    if (command.name) {
      hotkeysMap.set(command.name, command.shortcut);
    }
  });

  return hotkeysMap;
}
