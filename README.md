# NiceTab

![NiceTab](https://github.com/user-attachments/assets/6099f21e-fc0a-4bb5-8280-e497be3fb0ae)

## 扩展安装
- 谷歌 Chrome 应用商店：[Chrome Web Store](https://chromewebstore.google.com/detail/fonflmjnjbkigocpoommgmhljdpljain)
- 微软 Edge 商店：[Microsoft Edge Addons](https://microsoftedge.microsoft.com/addons/detail/ompjiaelpibiggcnanhbdblkhfdmkgnl) （（由于审核周期比较长，版本发布会比Chrome版本慢））
- Firefox 暂未发布。

## 基础介绍
- 本项目是一个方便快捷管理浏览器标签页的浏览器插件。
- 取名 `NiceTab` 是希望它是一个用起来很 nice 的 tab 标签页管理工具（不过本人的UI和交互设计太差，只能凑合凑合了）。 
- 类似于 `OneTab`、`N-Tab` 等标签页管理插件，支持**谷歌Chrome**、**Firefox**、**微软Edge**等浏览器。
- 采用 `react` 语言，基于[wxt框架](https://wxt.dev/)开发（wxt框架内置 `vanilla | vue | react | svelte | solid` 语言的初始化模板）。
- UI直接使用了 `Ant Design` 这个常用的 UI 框架。

## 项目初衷
我本人有点强迫症，浏览器标签页开多了就会焦虑，而且想要在众多标签页中切换到指定的页面也比较费劲儿。   
后来用上 OneTab 之后，管理标签页方便了不少，提升了效率也节省了内存。因此很长一段时间一直使用 OneTab 插件来管理浏览器标签页。   

经过一段时间对 OneTab 的使用体验，个人感觉有几个点不是特别顺手：
- 标签组虽然能重命名，但是导出后再导入就会丢失。
- 由于标签组重命名会丢失，所以我懒得花时间重命名，当标签组积累多了之后，很难找到指定的标签组。
- 插件图标右键菜单经常会出现好几个重复的菜单组，其中只有一个菜单组是能用的，但是你得挨个试才知道。
- 有时候我只是想要将一些标签页收藏进列表，并不想关闭它们，但是 OneTab 没有对应的设置项（这个只是我个人体验）。
- 还有就是，我想将某个标签组中的标签页移动到新的标签组，但是又没办法创建标签组，只能通过插件图标发送标签页到 OneTab 列表来创建新标签页。
- 。。。

另外，N-Tab 插件是开源的，当我看了它的源码后发现技术栈相对比较老旧，想参与共建有心无力了。

基于上面几点原因，最终促使我开发了 NiceTab 这个插件，在借鉴 `OneTab`、`N-Tab` 等插件现有部分功能的基础上，添加了一些其他的功能。

## 功能介绍
- 支持分类、标签组、标签页管理，包括一键收集保存、恢复、星标、锁定、增删改查、拖拽排序等功能。
- 分类支持展开/收起，支持创建分类和标签组，方便移动其他标签组/标签页到新分类/新标签组。
- 支持多种插件格式的 **导入/导出** 功能，支持导出到本地。目前支持 `NiceTab`、`OneTab` 格式的交叉导入导出（比如：可选择导入OneTab格式并导出为NiceTab格式；或者将NiceTab格式导出为OneTab格式），后续可根据需求增加其他插件格式的导入导出功能。
- 支持**远程同步功能**：
  - gists同步: 您可根据需求将标签页同步到自己的 github 和 gitee 账号，只需要配置自己的 access token 即可（注意 token 权限只勾选 gists 操作），后期看看能否扩展配置其他平台方案。
  - webDAV同步: 您可根据需求将标签页同步到自己的 webDAV 网盘，只需要配置 webDAV 的 url，username，password即可（支持配置多个 webDAV 账号）。
- 支持手动切换**亮色/暗黑主题**。
- 支持**皮肤主题切换**，目前暂时设置了有限的几种主题色提供选择，后续可根据需求扩大选择范围。
- 支持**多语言**，目前暂时支持中英文切换 (非地道英语，期待英语大佬帮忙校正)。
- 支持**回收站功能**，回收站中的标签页可还原到标签列表或者彻底删除。标签列表和回收站支持根据分类和标签组归类合并，方便管理。
- 支持浏览器快捷命令（打开NiceTab管理后台、发送所有标签页、发送当前标签页等）。
- 支持设置 **启动浏览器时是否自动打开NiceTab管理后台**。
- 支持设置 **是否固定NiceTab管理后台**。
- 支持设置 **发送标签页时-是否发送固定标签页到NiceTab**。
- 支持设置 **发送标签页时-是否打开NiceTab管理后台**。
- 支持设置 **发送标签页时-是否自动关闭标签页**。
- 支持设置 **是否在新窗口打开标签组**。
- 支持设置 **打开标签页/标签组时-是否自动删除标签页**。
- 支持设置 **清空标签页时-是否自动删除该标签组**
- 支持设置 **发送标签页时-是否保留重复的标签组**
- 支持设置 **发送标签页时-是否保留重复的标签页**
- 支持设置 **标签组-复制链接模板格式**
- 支持设置 **是否在扩展图标上显示打开的标签页数量**
- 支持标签页手动去重。
- 支持一键发送 所有标签页、当前标签页、其他标签页、左侧标签页、右侧标签页。
- 支持发送新版浏览器自带的标签组到NiceTab, 支持以标签组形式打开到浏览器。
- 支持快捷键（目前只添加了分类、标签组的上下移动排序的快捷键操作，后续可根据需求添加其他功能的快捷键操作）。
- 标签页支持自定义编辑修改标题和url。
- 添加固定置顶的特殊分类-**中转站**，发送标签页/标签组时自动收集到中转站中。
- 添加标签组按字母排序功能。
- 支持一键复制标签组所有标签页的链接, 复制链接支持自定义模板。
- 支持标签页和url搜索。


## 功能截图
### 点击扩展图标
- 点击扩展图标，弹出popup面板。
- popup面板，可快速访问 列表页，设置页面，导入导出页面，回收站页面。
- popup面板，可快捷切换主题色。
- popup面板，可快捷访问和关闭当前打开的标签页。

![NiceTab-扩展图标点击](https://github.com/user-attachments/assets/cf65a363-3a2b-465a-936c-8fc8274856dc)

![NiceTab-扩展图标点击](https://github.com/user-attachments/assets/899bfd01-c426-4c5b-af5e-0beb52882edf)

### 右键菜单
右击扩展图标，展示右键菜单，可打开扩展管理后台页面。支持 一键发送 所有标签页、当前标签页、其他标签页、左侧标签页、右侧标签页。

![NiceTab-扩展图标右键菜单](https://github.com/user-attachments/assets/2fe82628-9dde-4cba-b336-6ca59b2ec5eb)

### 扩展管理后台-列表页
- 管理发送到NiceTab的标签页，支持分类，标签组管理。
- 左侧列表支持拖拽和快捷键排序，右侧面板展示当前分类中的所有标签组和标签页，可进行相应的操作。
- 支持标签组删除和跨分类移动，以及多选标签页删除和跨标签组移动。

![NiceTab-列表页](https://github.com/user-attachments/assets/03a534d0-c034-4b9a-98fd-2d8d084ebcd3)

### 扩展管理后台-偏好设置页
您可根据自己的喜好，作相应的偏好设置。

![NiceTab-偏好设置页](https://github.com/user-attachments/assets/90e19998-206b-42de-9329-410e553955a4)

### 扩展管理后台-导入导出
导入导出功能目前支持 `NiceTab` 和 `OneTab` 格式的交叉导入导出。
- 可导入 `OneTab` 格式的列表并解析为 `NiceTab` 格式。
- 可将 `NiceTab`格式的列表导出为 `NiceTab` 或 `OneTab` 格式。

![NiceTab-导入导出](https://github.com/user-attachments/assets/e2ea4b00-3531-4819-b67a-e45f09b4e948)

### 远程同步功能
您可根据需求将标签页同步到自己的 github 和 gitee 账号，只需要配置自己的 access token 即可。    
**注意**：token 权限只勾选 gists 操作，后期看看能否扩展配置其他平台方案

![NiceTab-远程同步功能](https://github.com/user-attachments/assets/1d082c8f-4660-4f8e-9ac9-7cf468178ee1)

### 主题色切换
插件支持主题色切换，您可以在扩展管理后台页或者 popup 弹窗中进行切换。

![NiceTab-主题色切换](https://github.com/user-attachments/assets/9e6dce98-8b6e-4fe7-846d-d5a00f410e6d)

### 亮色/暗黑主题切换
插件支持亮色/暗黑主题切换，您可以在扩展管理后台页中进行切换。

![NiceTab-亮色-黑暗主题切换](https://github.com/user-attachments/assets/8d7a6f02-9feb-4289-b9f8-f066ab02f32e)

### 切换语言
插件支持语言切换，您可以在扩展管理后台页进行切换。

![NiceTab-切换语言](https://github.com/user-attachments/assets/2d6b2348-a666-4996-bdd9-8653dfabf1d4)

### 扩展管理后台-回收站
- 分类、标签组、标签页删除后，会保留到回收站，您可将回收站的分类、标签组等还原到列表页或者彻底删除。

![NiceTab-回收站](https://github.com/user-attachments/assets/016cb266-fe12-4063-b786-c979288f01fb)


## 使用
- 点击扩展图标，打开popup面板，显示当前已打开的标签页列表，可快速访问扩展管理后台，快速切换主题。
- 右击扩展图标，展示快捷操作菜单，可发送标签页到扩展管理后台。
- 打开**管理后台**，可进行语言切换和主题切换。
- 打开**管理后台**，可进行亮色/暗黑主题切换。
- 打开**管理后台 > 标签列表**页，查看已发送的标签页列表，支持分类和标签组管理。
- 打开**管理后台 > 设置**页，可保存扩展的偏好设置。
- 打开**管理后台 > 导入导出**页，可进行NiceTab和OneTab格式的标签页导入导出操作。
- 打开**管理后台 > 同步**页，可根据需求将标签页同步到自己的 github 和 gitee 账号，只需要配置自己的 access token 即可（注意 token 权限只勾选 gists 操作）。
- 打开**管理后台 > 回收站**页，可查看和管理从标签列表页中删除的分类、标签组、标签页，并进行还原和删除操作。

## 更新计划
- [x] NiceTab 和 OneTab 格式导入导出功能
- [x] 回收站功能
- [x] 切换皮肤功能
- [x] 支持切换亮色/暗黑主题
- [x] 支持多语言（目前暂时支持中英文切换）
- [x] 标签页支持自定义编辑修改标题和url
- [x] 版本检测，提示更新
- [x] 发送标签页支持浏览器自带的标签组单独成组，打开NiceTab标签组时支持以浏览器自带标签组形式打开。
- [x] 新增设置项：删除标签页时, 是否自动删除空标签组
- [x] 新增设置项：发送标签组/标签页时是否去重
- [x] 远程同步功能：由于 Chrome Api限制，远程同步有数据大小和频次限制，大小限制 100K，频次限制 1次/2秒。所以采用将标签页同步到自己的 github 和 gitee 账号，只需要配置自己的 access token 即可（注意 token 权限只勾选 gists 操作）。
- [x] webDAV 远程同步功能。
- [x] 发送标签页操作添加快捷键。
- [ ] 扩展图标右键菜单支持按需配置。
- [ ] 其他

## 沟通交流

### QQ群: 924270240

<img width="300" alt="NiceTab交流群" src="https://github.com/user-attachments/assets/f773c96e-8f4f-4e53-9ffa-20c11690675a">

## 参考链接
- [Chrome for Developers - Extensions > API 参考](https://developer.chrome.com/docs/extensions/reference/api?hl=zh-cn)
- [WXT 官网](https://wxt.dev/)
- [Ant Design](https://ant-design.antgroup.com/index-cn)
- [React Router](https://reactrouter.com/)
- [styled-components](https://styled-components.com/)
- [react-intl](https://formatjs.io/docs/react-intl)
- [pragmatic-drag-and-drop](https://atlassian.design/components/pragmatic-drag-and-drop/about)
- [【干货】Chrome插件(扩展)开发全攻略](https://www.cnblogs.com/liuxianan/p/chrome-plugin-develop.html)


## 插件开发

- 依赖安装：`pnpm install`
- 启动插件服务：`pnpm run dev`
- 
**注意**：每个js文件都必须有 `export default` 默认导出，否则本地启动服务时会报错。
