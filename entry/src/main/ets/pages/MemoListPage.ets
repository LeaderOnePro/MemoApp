import router from '@ohos.router';
import promptAction from '@ohos.promptAction';
import common from '@ohos.app.ability.common';
import { MemoViewModel } from '../viewmodel/MemoViewModel';
import { Memo } from '../model/Memo';

@Entry
@Component
struct MemoListPage {
  // Instantiate the ViewModel.
  // Use @Observed/@ObjectLink or appropriate state management decorator if needed for the VM instance itself.
  // For simplicity here, assuming direct usage and @Observed within the VM handles updates.
  // Depending on exact state management patterns in API 9, might need @Provide / @Consume or other mechanisms.
  @State // Using @State for the VM instance itself to trigger re-render on assignment, though internal changes handled by @Observed
  viewModel: MemoViewModel = new MemoViewModel();
  // State for search input, distinct from viewModel's searchKeyword to allow debouncing/manual triggering
  @State searchInput: string = '';

  // Property to hold context if available directly (FA-like approach)
  private context: common.UIAbilityContext | null = null;

  // Lifecycle hook: called when the page is about to appear
  aboutToAppear() {
    // Try accessing this.context directly and assert type
    // Note: This might not work in pure Stage model if context isn't automatically injected.
    // If this fails, context needs to be obtained via UIAbility.onCreate or similar and passed down.
    this.context = this.context as common.UIAbilityContext; // Assuming this.context exists from framework

    if (this.context) {
      this.viewModel.initialize(this.context);
      this.viewModel.loadInitialData();
    } else {
      // Fallback or alternative way to get context might be needed here if this.context is null
      // For now, log an error. Getting context reliably can be tricky depending on exact setup.
      console.error('MemoListPage', 'Failed to get context directly (this.context is null/undefined). Needs proper injection or alternative retrieval.');
      promptAction.showToast({ message: '无法初始化页面数据' });
    }
  }

  // Helper function to format timestamp to a readable date string
  formatDate(timestamp: number): string {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      // Simple YYYY-MM-DD format
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    } catch (e) {
      console.error('MemoListPage', `Error formatting date: ${e}`);
      return '日期错误';
    }
  }

  // Navigate to the edit page (for adding or editing)
  goToEditPage(memoId?: number) {
    const params = memoId !== undefined ? { memoId: memoId.toString() } : {};
    router.pushUrl({
      url: 'pages/MemoEditPage', // Path to the edit page component
      params: params
    }).catch(err => {
      console.error(`Failed to route to MemoEditPage: ${JSON.stringify(err)}`);
      promptAction.showToast({ message: '页面跳转失败' });
    });
  }

  build() {
    // Use Stack as the root container
    Stack({ alignContent: Alignment.TopStart }) {
      // Main content column
      Column() {
        // Title Bar
        Row() {
          Text('备忘录')
            .fontSize(24)
            .fontWeight(FontWeight.Bold)
            .layoutWeight(1)
            .textAlign(TextAlign.Start)
            .padding({ left: 16 })
        }
        .width('100%')
        .height(56)
        .backgroundColor(Color.Blue)

        // Search Input
        TextInput({ placeholder: '搜索笔记标题...', text: this.searchInput })
          .width('90%')
          .height(40)
          .margin({ top: 10, bottom: 10, left: '5%' }) // Center search input
          .onChange((value: string) => {
            this.searchInput = value;
            this.viewModel.searchMemos(this.searchInput);
          })

        // Loading Indicator or List
        Stack({ alignContent: Alignment.Center }) {
          List({ space: 10 }) {
            ForEach(this.viewModel.memos, (memo: Memo) => {
              ListItem() {
                Row() {
                  Column() {
                    Text(memo.title)
                      .fontSize(this.viewModel.titleFontSize)
                      .fontWeight(FontWeight.Medium)
                      .maxLines(1)
                      .textOverflow({ overflow: TextOverflow.Ellipsis })
                    Text(this.formatDate(memo.modifiedDate))
                      .fontSize(12)
                      .fontColor(Color.Gray)
                      .margin({ top: 4 })
                  }
                  .layoutWeight(1)
                  .alignItems(HorizontalAlign.Start)
                }
                .padding(16)
                .width('100%')
              }
              .swipeAction({ end: this.DeleteButton(memo) })
              .onClick(() => {
                this.goToEditPage(memo.id);
              })
            }, (memo: Memo) => memo.id?.toString() ?? Math.random().toString())
          }
          .width('100%')
          .layoutWeight(1)
          .visibility(this.viewModel.isLoading ? Visibility.Hidden : Visibility.Visible)
          // Add padding to the bottom of the list itself to avoid overlap with FAB
          .padding({ bottom: 80 })

          if (!this.viewModel.isLoading && this.viewModel.memos.length === 0) {
            Text(this.viewModel.searchKeyword ? '未找到匹配的笔记' : '还没有笔记，快添加一个吧！')
              .fontSize(16)
              .fontColor(Color.Gray)
              .textAlign(TextAlign.Center)
              .margin(20)
          }

          if (this.viewModel.isLoading) {
            Progress({ type: ProgressType.Ring, value: 0 })
              .width(50)
              .color(Color.Orange)
          }
        }
        .layoutWeight(1) // Stack takes remaining vertical space in the Column
      }
      .width('100%')
      .height('100%') // Column takes full height of the Stack
      // Remove padding and overlay from here

      // FAB placed directly within the root Stack
      Button({ type: ButtonType.Circle }) {
        Text('+')
          .fontSize(24)
          .fontColor(Color.White)
      }
      .width(56)
      .height(56)
      .backgroundColor(Color.Orange)
      .position({ x: '85%', y: '88%' }) // Position FAB at bottom right using x/y
      .onClick(() => {
        this.goToEditPage();
      })
    }
    .width('100%') // Stack takes full width
    .height('100%') // Stack takes full height
  }

  // Custom builder function for the delete button in swipe action
  @Builder DeleteButton(memo: Memo) {
    Button() {
      Text('删')
        .fontColor(Color.White)
        .fontSize(18) // Adjusted size for text
        .fontWeight(FontWeight.Bold)
        .margin({ right: 5 }) // Adjust margin if needed

      Text('删除')
        .fontColor(Color.White)
        .fontSize(14)
        .margin({ left: 5 })
    }
    .type(ButtonType.Circle)
    .width(100) // Adjust width as needed
    .height('100%')
    .backgroundColor(Color.Red)
    .onClick(async () => {
      // Confirmation dialog before deleting
      try {
        const result = await promptAction.showDialog({
          title: '确认删除',
          message: `确定要删除笔记 "${memo.title}" 吗？此操作无法撤销。`,
          buttons: [
            { text: '取消', color: '#FFA500' }, // Orange placeholder for accent
            { text: '删除', color: '#FF0000' }  // Red
          ]
        });
        if (result.index === 1) { // Index 1 corresponds to the '删除' button
          console.info(`User confirmed deletion for memo ID: ${memo.id}`);
          if (memo.id !== undefined) {
             await this.viewModel.deleteMemo(memo.id);
             promptAction.showToast({ message: '笔记已删除' });
          } else {
             console.error('Cannot delete memo with undefined ID');
          }
        } else {
          console.info('User cancelled deletion.');
        }
      } catch (err) {
        console.error(`Dialog error or deletion failed: ${JSON.stringify(err)}`);
      }
    })
  }
} 