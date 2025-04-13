import router from '@ohos.router';
import promptAction from '@ohos.promptAction';
import common from '@ohos.app.ability.common';
import { MemoViewModel } from '../viewmodel/MemoViewModel';
import { Memo } from '../model/Memo';
// Removed getContext import again

@Entry
@Component
struct MemoEditPage {
  // Use the same ViewModel instance if provided via state management (@Consume, @ObjectLink)
  // For simplicity, creating a new instance here, but it won't share state with the list page directly.
  // A better approach would involve a shared ViewModel instance via @Provide/@Consume or dependency injection.
  // For this example, we'll re-initialize and load data if needed.
  @State viewModel: MemoViewModel = new MemoViewModel();
  @State memoTitle: string = '';
  @State memoContent: string = '';
  private memoId: number | null = null; // To store the ID passed from the list page
  private isEditMode: boolean = false;

  // Add context property to potentially receive context from framework
  private context: common.UIAbilityContext | null = null; 

  aboutToAppear() {
    // Attempt to use this.context directly if available
    if (this.context && typeof this.context === 'object') { // Basic check if context exists
      console.info('MemoEditPage', 'Using this.context');
      this.viewModel.initialize(this.context);
    } else {
      // Log error if context is not available via this.context
      // In a real Stage app, context should be obtained from UIAbility and provided here.
      console.error('MemoEditPage', 'Failed to get context via this.context. App might need context injection.');
      promptAction.showToast({ message: '无法初始化页面环境' });
      return; // Stop further processing if context is unavailable
    }

    // Check router parameters for memoId
    const params = router.getParams() as Record<string, string>; // Cast to expected type
    if (params && params['memoId']) {
      const id = parseInt(params['memoId']);
      if (!isNaN(id)) {
        this.memoId = id;
        this.isEditMode = true;
        console.info('MemoEditPage', `Edit mode for memo ID: ${this.memoId}`);
        this.loadExistingMemoData(); // Load data for editing
      } else {
         console.error('MemoEditPage', `Invalid memoId parameter: ${params['memoId']}`);
         promptAction.showToast({ message: '无效的笔记ID' });
         router.back(); // Go back if ID is invalid
      }
    } else {
      this.isEditMode = false;
      this.viewModel.prepareNewMemo(); // Prepare for new memo
      console.info('MemoEditPage', 'Add mode');
    }
  }

  // Load data if in edit mode
  async loadExistingMemoData() {
    if (this.memoId !== null) {
      await this.viewModel.loadMemoById(this.memoId);
      // Update local state based on loaded memo
      if (this.viewModel.currentMemo) {
        this.memoTitle = this.viewModel.currentMemo.title;
        this.memoContent = this.viewModel.currentMemo.content;
      } else {
         // Handle case where memo wasn't found (e.g., deleted after clicking)
         promptAction.showToast({ message: '无法加载笔记数据' });
         router.back();
      }
    }
  }

  // Save button action
  async saveMemo() {
    if (!this.memoTitle.trim()) {
      promptAction.showToast({ message: '标题不能为空' });
      return;
    }

    const success = await this.viewModel.saveCurrentMemo(this.memoTitle.trim(), this.memoContent.trim());

    if (success) {
      promptAction.showToast({ message: this.isEditMode ? '笔记已更新' : '笔记已添加' });
      router.back(); // Go back to the list page
    } else {
      promptAction.showToast({ message: '保存失败，请稍后重试' });
    }
  }

  build() {
    Column() {
      // Title Bar
      Row() {
        // Back Button (Placeholder Text)
        Text('<')
          .fontSize(24).fontWeight(FontWeight.Bold).margin({ left: 16 })
          .onClick(() => router.back())
          // .fillColor(Color.Black) // Removed as Text color is default

        Text(this.isEditMode ? '编辑笔记' : '添加笔记')
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .layoutWeight(1)
          .textAlign(TextAlign.Center)
          .margin({ right: 40 }) // Balance the back button space

        // Save Button
        Button('保存')
          .fontSize(16)
          .fontColor(Color.Blue)
          .backgroundColor(Color.Transparent)
          .margin({ right: 16 })
          .onClick(() => this.saveMemo())
          .visibility(this.viewModel.isLoading ? Visibility.None : Visibility.Visible)

        // Loading indicator during save
        if (this.viewModel.isLoading) {
          Progress({ type: ProgressType.Ring, value: 0 }).width(24).height(24).margin({ right: 16 })
        }

      }
      .width('100%')
      .height(56)
      .border({ width: { bottom: 1 }, color: '#FFE0E0E0' }) // Add a bottom border

      // Title Input
      TextInput({ placeholder: '标题', text: this.memoTitle })
        .fontSize(this.viewModel.titleFontSize > 20 ? this.viewModel.titleFontSize : 20) // Ensure minimum size
        .fontWeight(FontWeight.Medium)
        .backgroundColor(Color.Transparent) // No background
        .onChange((value: string) => { this.memoTitle = value; })
        .margin({ top: 10, left: 16, right: 16 })
        .width('calc(100% - 32vp)') // Use calc for precise width

      // Divider
      Divider().margin({ top: 5, bottom: 5, left: 16, right: 16 })

      // Content Input using TextArea for multi-line
      TextArea({ placeholder: '内容', text: this.memoContent })
        .fontSize(this.viewModel.contentFontSize > 14 ? this.viewModel.contentFontSize : 14) // Ensure minimum size
        .backgroundColor(Color.Transparent)
        .layoutWeight(1) // Take remaining vertical space
        .onChange((value: string) => { this.memoContent = value; })
        .margin({ left: 16, right: 16, bottom: 16 })
        .width('calc(100% - 32vp)') // Use calc for precise width
        .textAlign(TextAlign.Start)

    }
    .width('100%')
    .height('100%')
    .alignItems(HorizontalAlign.Start) // Align children to the start horizontally
  }
} 