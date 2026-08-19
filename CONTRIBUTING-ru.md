# Руководство по участию

<p>
  Русский | <a href="./CONTRIBUTING.md">English</a> | <a href="./CONTRIBUTING-zh.md">中文</a>
</p>

## Отправка кода

1. Сделайте [Fork](https://github.com/web-dahuyou/NiceTab/fork) репозитория.
2. Клонируйте свой форк локально.

   ```bash
   git clone https://github.com/${yourname}/NiceTab
   ```
3. Создайте ветку `dev-your-awesome-code` от `dev`.

   ```bash
   git checkout -b dev-your-awesome-code origin/dev
   ```
4. Зафиксируйте изменения (следуйте [соглашениям о сообщениях коммитов](https://github.com/angular/angular/blob/main/contributing-docs/commit-message-guidelines.md)).
  Перед коммитом рекомендуется выполнить `pnpm compile`, чтобы проверить типы TypeScript.

   ```bash
   pnpm compile
   git commit -m 'feat: add a new feature'
   ```
5. Отправьте ветку в свой удалённый репозиторий.

   ```bash
   git push -u origin dev-your-awesome-code
   ```
6. [Создайте Pull Request](https://github.com/web-dahuyou/NiceTab/compare) из `dev-your-awesome-code` в ветку `dev` репозитория [web-dahuyou/NiceTab](https://github.com/web-dahuyou/NiceTab/compare/dev).

   ```bash
   https://github.com/web-dahuyou/NiceTab/compare/dev...${yourname}:NiceTab:dev-your-awesome-code
   ```

## Правила разработки

### Настройка проекта
- Установка зависимостей:  
  `pnpm install`
- Запуск dev-сервера:  
  `pnpm run dev`

### Обязательный export

Важно: в каждом файле `.js`, `.ts`, `.tsx` должен быть `export default`. Иначе локальный сервер выдаст ошибку.

### Алиас путей импорта

Для импортов из каталога `entrypoints` используется алиас `~` (алиас `@` тоже работает, но для единообразия лучше `~`).

```ts
import { something } from '~/entrypoints/common/utils';
```

### Путь к бинарникам браузера

По умолчанию `WXT` пытается сам найти установленные `Chrome/Firefox`. Если появляется ошибка:

```
ERROR  No Chrome installations found.  
```

или нужно указать свой исполняемый файл браузера, см. [документацию — Set Browser Binaries](https://wxt.dev/guide/essentials/config/browser-startup.html#set-browser-binaries).

```js
// <rootDir>/web-ext.config.ts

export default defineRunnerConfig({
  binaries: {
    chrome: '/path/to/chrome-beta', // Chrome Beta вместо обычного Chrome
    firefox: 'firefoxdeveloperedition', // Firefox Developer Edition вместо обычного Firefox
    edge: '/path/to/edge', // MS Edge при запуске "wxt -b edge"
  },
});
```

### Сохранение данных пользователя

Чтобы сохранять данные между сессиями разработки, следуйте [официальной документации — persist-data](https://wxt.dev/guide/essentials/config/browser-startup.html#persist-data).

```js
// <rootDir>/web-ext.config.ts

import { defineRunnerConfig } from 'wxt';

// Mac/Linux
export default defineRunnerConfig({
   chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
});

// Windows
import path from 'path';
export default defineRunnerConfig({
   // В Windows путь должен быть абсолютным
   chromiumProfile: path.resolve('.wxt\\chrome-data'),
   keepProfileChanges: true
})
```
