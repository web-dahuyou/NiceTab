# NiceTab

![NiceTab](https://github.com/user-attachments/assets/6099f21e-fc0a-4bb5-8280-e497be3fb0ae)

<p>
  中文 | <a href="./README.md">English</a>
</p>

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/web-dahuyou/NiceTab)

## 基础介绍
- 本项目是一个免费开源的浏览器标签页管理器插件，OneTab、Toby、SessionBuddy 等扩展的升级替代品，功能丰富易用。
- 取名 `NiceTab` 是希望它是一个用起来很 nice 的 tab 标签页管理工具（不过本人的UI和交互设计太差，只能凑合凑合了）。
- 类似于 `OneTab`、`Toby`、`SessionBuddy`、`N-Tab`、`KepTab` 等标签页管理插件，支持**谷歌Chrome**、**Firefox**、**微软Edge**等浏览器。
- 采用 `react` 语言，基于[wxt框架](https://wxt.dev/)开发（wxt框架内置 `vanilla | vue | react | svelte | solid` 语言的初始化模板）。
- UI直接使用了 `Ant Design` 这个常用的 UI 框架。


## 扩展安装
- 谷歌 Chrome 应用商店：[Chrome Web Store](https://chromewebstore.google.com/detail/fonflmjnjbkigocpoommgmhljdpljain)
- 微软 Edge 商店：[Microsoft Edge Addons](https://microsoftedge.microsoft.com/addons/detail/ompjiaelpibiggcnanhbdblkhfdmkgnl) （由于审核周期比较长，版本发布会比Chrome版本慢）
- Firefox 附加组件: [Firefox Browser Addons](https://addons.mozilla.org/firefox/addon/nice-tab-manager)

### 注意事项
出于安全原因，在 Firefox 中，可能不允许使用特权 URL，例如：
- chrome: URL
- javascript: URL
- data: URL
- file: URL
- Firefox 的特权 about: URL（例如，`about:config`、`about:addons`、`about:debugging`）。非特权 URL（例如 `about:blank`）是允许的。

如果页面链接符合上述场景，点击链接可能无法打开页面，请手动复制链接进行访问。

## 功能介绍
<p>
  详细用户操作指南见 <a href="./GUIDE-zh.md">NiceTab 用户指南</a>
</p>

### 通用功能
- 支持一键发送 所有标签页、所有窗口标签页、当前标签组、当前标签页、其他标签页、左侧标签页、右侧标签页等。
- 支持发送新版浏览器自带的标签组到NiceTab, 支持以标签组形式打开到浏览器。
- 支持浏览器快捷命令（打开NiceTab管理后台、全局搜索、发送所有标签页、发送当前标签页等）。
- 支持偏好设置。
- 支持多种插件的数据导入，支持导出到本地。目前支持 `NiceTab`、`OneTab`、`Toby`、`SessionBuddy`、`KepTab` 格式的导入，后续可根据需求增加其他插件格式的适配导入。
- 支持**远程同步功能**。
- 支持手动切换**亮色/暗黑主题**。
- 支持**皮肤主题切换**，目前暂时设置了有限的几种主题色提供选择，后续可根据需求扩大选择范围。
- 支持**多语言**，目前暂时支持简体中文、繁体中文、英文。
- 支持**回收站功能**，回收站中的标签页可还原到标签列表或者彻底删除。标签列表和回收站支持根据分类和标签组归类合并，方便管理。
- 支持手动休眠标签页来释放内存（休眠中的标签页仍会显示在标签栏中，并会在激活后重新加载）。

### 列表管理
- 支持分类、标签组、标签页管理，包括一键收集保存、恢复、星标、锁定、增删改查、拖拽排序等功能。
- 支持全局搜索标签页和url，选择标签页后跳转定位到指定标签页。
- 支持分类锁定功能，防误触操作。
- 分类支持展开/收起，支持创建分类和标签组，方便移动其他标签组/标签页到新分类/新标签组。
- 支持列表页快捷键（目前只添加了分类、标签组的上下移动排序的快捷键操作，后续可根据需求添加其他功能的快捷键操作）。
- 支持标签组按名称和创建时间排序。
- 支持一键复制标签组所有标签页的链接, 复制链接支持自定义模板。
- 支持标签页手动去重。
- 支持多选标签页、复制标签页、跨标签组移动或复制。
- 标签页支持自定义编辑修改标题和url。

### 偏好设置
- 支持设置 **启动浏览器时是否自动打开NiceTab管理后台**。
- 支持设置 **是否固定NiceTab管理后台**。
- 支持设置 **发送标签页时-是否发送固定标签页到NiceTab**。
- 支持设置 **发送标签页时-是否打开NiceTab管理后台**。
- 支持设置 **发送标签页时-是否自动关闭标签页**。
- 支持设置 **发送标签页时-是否保留重复的标签组**。
- 支持设置 **发送标签页时-是否保留重复的标签页**。
- 添加固定置顶的特殊分类-**中转站**，发送标签页/标签组时自动收集到中转站中。
- 发送标签页支持选择指定目录。
- 发送标签页支持配置域名排除。
- 支持设置 **是否在新窗口打开标签组**。
- 支持设置 **打开标签页/标签组时-是否自动删除标签页**。
- 支持设置 **打开多个标签页时是否自动休眠**。
- 支持设置 **静默打开标签页的修饰键**。
- 支持设置 **前台打开标签页的修饰键**。
- 支持设置 **清空标签页时-是否自动删除该标签组**。
- 支持设置 **标签组-复制链接模板格式**。
- 支持设置 **是否在扩展图标上显示打开的标签页数量**。
- 支持设置 **是否在网页中显示NiceTab右键菜单**。
- 支持 **Popup面板模块展示设置**，如果不选择面板模块，则左击扩展图标直接发送所有标签页。
- 支持设置 **进入列表页时-是否自动展开全部节点**。
- ...更多设置项可前往插件 `管理后台>偏好设置` 查看或查看用户指南。

### 远程同步功能

- 远程同步支持 `gists` 和 `webDAV` 两种类型。
  - gists同步: 您可根据需求将标签页同步到自己的 github 和 gitee 账号，只需要配置自己的 access token 即可（注意 token 权限只勾选 gists 操作），后期看看能否扩展配置其他平台方案。
  - webDAV同步: 您可根据需求将标签页同步到自己的 webDAV 网盘，只需要配置 webDAV 的 url，username，password即可（支持配置多个 webDAV 账号）。
- 支持标签页和偏好设置的远程同步。
- 自动同步: 支持自动同步功能，可设置开启/关闭、同步频率、开启时段、同步方式等。

注意，目前`合并推送`模式不进行diff对比删除操作，而是合并远程和本地，然后推送到远程，所以标签页是会增多的，想要同步删除操作，请删除标签页后手动`覆盖推送`到远程


## 功能截图

**温馨提示** 扩展插件在不断更新迭代，以下截图只是历史版本的效果，欢迎安装体验。

### 点击扩展图标
- 默认点击扩展图标，弹出popup面板 (如果配置项中未配置popup面板模块， 则单击效果为直接发送全部标签页)。
- popup面板，可快速访问 列表页，设置页面，导入导出页面，远程同步页面，回收站页面。
- popup面板，可快捷切换主题色。
- popup面板，可快捷访问和关闭当前打开的标签页。

![NiceTab-扩展图标点击1](https://github.com/user-attachments/assets/debe19ca-cd80-4ec9-a8d3-79de6dafb5a7)

![NiceTab-扩展图标点击2](https://github.com/user-attachments/assets/f441c6c5-6da3-4769-a8a7-6691c0263613)

### 右键菜单
右击扩展图标，展示右键菜单，可打开扩展管理后台页面。支持 一键发送 所有标签页、当前标签页、其他标签页、左侧标签页、右侧标签页。

![NiceTab-扩展图标右键菜单](https://github.com/user-attachments/assets/555a2ed0-50d3-4bb3-8008-c6e61792aa9c)

### 扩展管理后台-列表页
- 管理发送到NiceTab的标签页，支持分类，标签组管理。
- 左侧列表支持拖拽和快捷键排序，右侧面板展示当前分类中的所有标签组和标签页，可进行相应的操作。
- 支持标签组删除和跨分类移动，以及多选标签页删除和跨标签组移动。

![NiceTab-列表页](https://github.com/user-attachments/assets/244fb841-a036-42ca-9840-edb29b0e81db)

### 扩展管理后台-偏好设置页
您可根据自己的喜好，进行相应的偏好设置。

![NiceTab-偏好设置页](https://github.com/user-attachments/assets/18448d35-060c-47fe-9ad5-251b2324e7a0)

### 扩展管理后台-导入导出
目前支持 `NiceTab` 和 `OneTab`、`Toby`、`SessionBuddy`、`KepTab` 格式的数据导入。
- 支持导入 `OneTab`、`Toby`、`SessionBuddy`、`KepTab` 格式的列表并解析为 `NiceTab` 格式。
- 支持将列表导出到本地。

![NiceTab-导入导出](https://github.com/user-attachments/assets/48b6d09b-342c-448e-b235-ae54c4aae235)

### 远程同步功能
远程同步支持 gitee gists, github gists 和 webdav 同步。
- gists 同步：您可根据需求将标签页同步到自己的 github 和 gitee 账号，只需要配置自己的 access token 即可。
- webdav 同步：您可根据需求将标签页同步到自己的 webDAV 网盘，只需要配置 webDAV 的 url，username，password即可（支持配置多个 webDAV 账号）。

**注意**：
- gists token 权限只勾选 gists 操作
- 合并推送不进行diff对比删除操作，而是合并远程和本地，然后推送到远程，所以标签页是会逐渐增多的，想要同步删除操作的话，请删除标签页后手动覆盖推送到远程

![NiceTab-远程同步功能](https://github.com/user-attachments/assets/446c6b94-55ad-46b3-a790-45e29027ee05)

### 主题色切换
插件支持主题色切换，您可以在扩展管理后台页或者 popup 弹窗中进行切换。

![NiceTab-主题色切换](https://github.com/user-attachments/assets/33ba956f-6801-490d-8507-b28854a8c0bc)

### 亮色/暗黑主题切换
插件支持亮色/暗黑主题切换，您可以在扩展管理后台页中进行切换。

![NiceTab-亮色-黑暗主题切换](https://github.com/user-attachments/assets/148d9f26-d1ad-4f1c-909a-02ad099432c2)

### 切换语言
插件支持语言切换，您可以在扩展管理后台页进行切换。

![NiceTab-切换语言](https://github.com/user-attachments/assets/ce9a7a2d-8b71-400a-98dd-e76cb565c021)

### 全局搜索
插件支持在任意网页进行全局搜索保存在 NiceTab 的标签页(支持标签名和 URL 链接)。

![NiceTab-全局搜索1](https://github.com/user-attachments/assets/6e94258d-75f5-4964-8b3b-a8fdefd93b94)

![NiceTab-全局搜索2](https://github.com/user-attachments/assets/a799282c-f702-4133-9478-bccf048d0a9d)

### 扩展管理后台-回收站
- 分类、标签组、标签页删除后，会保留到回收站，您可将回收站的分类、标签组等还原到列表页或者彻底删除。

![NiceTab-回收站](https://github.com/user-attachments/assets/2f22b6d3-ccf0-4939-a905-b781b74b25e9)


## 使用
- 点击扩展图标，打开popup面板，显示当前已打开的标签页列表，可快速访问扩展管理后台，快速切换主题。
- 右击扩展图标，展示快捷操作菜单，可发送标签页到扩展管理后台。
- 打开**管理后台**，可进行语言切换和主题切换。
- 打开**管理后台**，可进行亮色/暗黑主题切换。
- 打开**管理后台 > 标签列表**页，查看已发送的标签页列表，支持分类和标签组管理。
- 打开**管理后台 > 设置**页，可保存扩展的偏好设置。
- 打开**管理后台 > 导入导出**页，可进行 NiceTab、OneTab、Toby、SessionBuddy、KepTab 格式的标签页导入导出操作。
- 打开**管理后台 > 同步**页，可根据需求将标签页同步到自己的 github 和 gitee 账号，只需要配置自己的 access token 即可（注意 token 权限只勾选 gists 操作）。
- 打开**管理后台 > 回收站**页，可查看和管理从标签列表页中删除的分类、标签组、标签页，并进行还原和删除操作。

### 备注
出于安全原因，在 Firefox 中，可能不允许使用特权 URL，例如：
- chrome: URL
- javascript: URL
- data: URL
- file: URL
- Firefox 的特权 about: URL（例如，`about:config`、`about:addons`、`about:debugging`）。非特权 URL（例如 `about:blank`）是允许的。

如果页面链接符合上述场景，点击链接可能无法打开页面，请手动复制链接进行访问。

## 沟通交流

### QQ群: 924270240

<img width="300" alt="NiceTab交流群" src="https://github.com/user-attachments/assets/f773c96e-8f4f-4e53-9ffa-20c11690675a">

## 参考链接
- [Chrome for Developers - Extensions > API 参考](https://developer.chrome.com/docs/extensions/reference/api?hl=zh-cn)
- [Mozilla for Developers - WebExtensions API 文档](https://developer.mozilla.org/zh-CN/docs/Mozilla/Add-ons/WebExtensions)
- [WXT 官网](https://wxt.dev/)
- [Ant Design](https://ant-design.antgroup.com/index-cn)
- [React Router](https://reactrouter.com/)
- [styled-components](https://styled-components.com/)
- [react-intl](https://formatjs.io/docs/react-intl)
- [pragmatic-drag-and-drop](https://atlassian.design/components/pragmatic-drag-and-drop/about)


## 插件开发

见 [NiceTab 贡献指南](./CONTRIBUTING-zh.md)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=web-dahuyou/NiceTab&type=Date)](https://www.star-history.com/#web-dahuyou/NiceTab&Date)
