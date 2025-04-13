import router from '@ohos.router';
import promptAction from '@ohos.promptAction';
import common from '@ohos.app.ability.common';
import { MemoViewModel } from '../viewmodel/MemoViewModel';
import { Memo } from '../model/Memo';
// Import getContext if needed (Stage model)
// import { getContext } from '@ohos.abilityAccessCtrl';

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

  // Lifecycle hook: called when the page is about to appear
  aboutToAppear() {
    // In Stage model, get context like this (adjust if FA model)
    const context = getContext(this) as common.UIAbilityContext;
    if (context) {
      this.viewModel.initialize(context); // Initialize ViewModel with context
      this.viewModel.loadInitialData();   // Load initial data
    } else {
      console.error('MemoListPage', 'Failed to get context in aboutToAppear.');
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
    Column() {
      // Title Bar
      Row() {
        Text('备忘录')
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .layoutWeight(1) // Take remaining space
          .textAlign(TextAlign.Start)
          .padding({ left: 16 })

        // Optional: Settings button or other actions
      }
      .width('100%')
      .height(56) // Standard action bar height
      .backgroundColor($r('app.color.primary')) // Use resource color if defined

      // Search Input
      TextInput({ placeholder: '搜索笔记标题...', text: this.searchInput })
        .width('90%')
        .height(40)
        .margin({ top: 10, bottom: 10 })
        .onChange((value: string) => {
          this.searchInput = value;
          // Trigger search when input changes (consider adding debounce later)
          this.viewModel.searchMemos(this.searchInput);
        })

      // Loading Indicator or List
      Stack({ alignContent: Alignment.Center }) {
        // Memo List
        List({ space: 10 }) {
          ForEach(this.viewModel.memos, (memo: Memo) => {
            ListItem() {
              Row() {
                Column() {
                  Text(memo.title)
                    .fontSize(this.viewModel.titleFontSize) // Use font size from ViewModel
                    .fontWeight(FontWeight.Medium)
                    .maxLines(1)
                    .textOverflow({ overflow: TextOverflow.Ellipsis })

                  Text(this.formatDate(memo.modifiedDate)) // Show modified date
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
            .swipeAction({ end: this.DeleteButton(memo) }) // Swipe-to-delete action
            .onClick(() => {
              this.goToEditPage(memo.id); // Navigate to edit page on click
            })
          }, (memo: Memo) => memo.id?.toString() ?? Math.random().toString()) // Use ID as key, fallback for new items
        }
        .width('100%')
        .layoutWeight(1) // Fill remaining space
        .visibility(this.viewModel.isLoading ? Visibility.Hidden : Visibility.Visible)

        // Empty List Placeholder
        if (!this.viewModel.isLoading && this.viewModel.memos.length === 0) {
          Text(this.viewModel.searchKeyword ? '未找到匹配的笔记' : '还没有笔记，快添加一个吧！')
            .fontSize(16)
            .fontColor(Color.Gray)
            .textAlign(TextAlign.Center)
            .margin(20)
        }

        // Loading Progress Indicator
        if (this.viewModel.isLoading) {
          Progress({ type: ProgressType.Circular })
            .width(50)
            .color($r('app.color.accent')) // Use resource color
        }
      }
      .layoutWeight(1) // Stack takes remaining space

    }
    .width('100%')
    .height('100%')
    .padding({ bottom: 80 }) // Add padding to avoid overlap with FAB
    // Use Stack + Position for Floating Action Button
    .overlay(
      Button('+', { type: ButtonType.Circle, stateEffect: true })
        .width(56)
        .height(56)
        .backgroundColor($r('app.color.accent')) // Use resource color
        .fontColor(Color.White)
        .fontSize(24)
        .position({ x: '85%', y: '88%' }) // Position FAB at bottom right
        .onClick(() => {
          this.goToEditPage(); // Navigate to add page (no ID)
        }),
      { align: Alignment.BottomEnd, offset: { x: -16, y: -16 } } // Alternative positioning using overlay parameters
    )
  }

  // Custom builder function for the delete button in swipe action
  @Builder DeleteButton(memo: Memo) {
    Button() {
      Image($r('app.media.ic_delete')) // Use a delete icon resource
        .width(24)
        .height(24)
        .fillColor(Color.White)
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
            { text: '取消', color: $r('app.color.accent') },
            { text: '删除', color: Color.Red }
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

// Helper function to get context (Stage Model specific)
// Make sure this is accessible or defined correctly in your structure
// If FA model, context retrieval is different.
declare function getContext(component?: Object): common.UIAbilityContext; 