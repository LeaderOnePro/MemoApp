# HarmonyOS 备忘录应用 (MemoApp)

这是一个基于 HarmonyOS API 9 开发的简单备忘录应用程序，用于完成 LeaderOne 的应用开发实验五。

## 功能

*   **文件读写**: 演示将用户输入保存到本地文件及从文件读取内容。 (实验第一部分)
*   **备忘录**:
    *   使用关系型数据库 (SQLite) 存储笔记（标题、内容、创建日期、修改日期）。
    *   首页显示笔记列表。
    *   支持按标题关键字搜索笔记。
    *   添加新笔记。
    *   查看和修改现有笔记。
    *   左滑删除笔记。
    *   使用用户首选项 (Preferences) 保存和加载笔记列表的字体大小设置。

## 技术栈

*   HarmonyOS SDK (API 9)
*   ArkTS (UI 和业务逻辑)
*   ArkUI (声明式 UI 框架)
*   @ohos.fileio (文件操作)
*   @ohos.data.relationalStore (关系型数据库)
*   @ohos.data.preferences (用户首选项)

## 许可证

本项目采用 [GNU General Public License v3.0](LICENSE) 授权。 