import fileio from '@ohos.fileio';
import common from '@ohos.app.ability.common';
import util from '@ohos.util';

@Entry
@Component
struct FileIOPage {
  @State message: string = 'Hello World';
  @State fileContent: string = '文件内容将显示在这里';
  @State inputText: string = '';
  private filesDir: string = '';
  private fileName: string = 'XingMingPinYinXueHao.txt'; // <--- 请替换成你的文件名

  // 获取文件目录的函数 (建议在 aboutToAppear 中调用)
  async getFilesDir() {
    // 在 Stage 模型下获取 Context 的方式
    let context = getContext(this) as common.UIAbilityContext; // 或者通过其他方式获取 context
    if (context && context.filesDir) {
      this.filesDir = context.filesDir;
      console.info(`Application files dir: ${this.filesDir}`);
    } else {
      console.error("Failed to get filesDir");
      // 可以给用户提示或者使用默认路径
    }
  }

  aboutToAppear() {
    this.getFilesDir();
  }

  // 写入文件
  writeFile() {
    if (!this.filesDir) {
      this.fileContent = '错误：无法获取文件目录';
      return;
    }
    let filePath = this.filesDir + '/' + this.fileName;
    console.info(`Writing to file: ${filePath}`);
    let contentToWrite = this.inputText;
    let fd;
    try {
      // 0o102: O_WRONLY | O_CREAT | O_TRUNC (如果存在则覆盖)
      // 如果想追加，可以使用 0o101: O_WRONLY | O_APPEND (或者 0o1101 for O_WRONLY | O_APPEND | O_CREAT)
      fd = fileio.openSync(filePath, 0o102);
      let bytesWritten = fileio.writeSync(fd, contentToWrite);
      console.info(`Successfully wrote ${bytesWritten} bytes.`);
      this.fileContent = '写入成功！';
    } catch (err) {
      console.error(`Failed to write file: ${JSON.stringify(err)}`);
      this.fileContent = `写入失败: ${err.message}`;
    } finally {
      if (fd !== undefined) {
        fileio.closeSync(fd);
      }
    }
  }

  // 读取文件
  readFile() {
    if (!this.filesDir) {
      this.fileContent = '错误：无法获取文件目录';
      return;
    }
    let filePath = this.filesDir + '/' + this.fileName;
    console.info(`Reading from file: ${filePath}`);
    let fd;
    try {
      // 0o0: O_RDONLY
      fd = fileio.openSync(filePath, 0o0);
      let stat = fileio.statSync(filePath);
      let buf = new ArrayBuffer(stat.size);
      let bytesRead = fileio.readSync(fd, buf);
      console.info(`Successfully read ${bytesRead} bytes.`);
      // 将 ArrayBuffer 转换为字符串 (简单方式，注意编码问题)
      // 假设文件是 UTF-8 编码
      const textDecoder = new util.TextDecoder('utf-8'); // 需要 import util from '@ohos.util';
      this.fileContent = textDecoder.decodeWithStream(new Uint8Array(buf));
      // 或者简单方式（可能不适用于所有字符）：
      // this.fileContent = String.fromCharCode.apply(null, new Uint8Array(buf));

    } catch (err) {
      console.error(`Failed to read file: ${JSON.stringify(err)}`);
      this.fileContent = `读取失败: ${err.message}`;
    } finally {
      if (fd !== undefined) {
        fileio.closeSync(fd);
      }
    }
  }

  build() {
    Row() {
      Column({ space: 10 }) {
        Text(this.message).fontSize(20).fontWeight(FontWeight.Bold)

        TextInput({ placeholder: '请输入要保存的内容', text: this.inputText })
          .onChange((value: string) => {
            this.inputText = value;
          })
          .height(50)
          .width('90%')

        Button('保存到文件')
          .onClick(() => {
            this.writeFile();
          })
          .width('80%')

        Button('从文件读取')
          .onClick(() => {
            this.readFile();
          })
          .width('80%')
          .margin({ top: 10 })

        Text(this.fileContent)
          .fontSize(16)
          .margin({ top: 20 })
          .width('90%')
          .textAlign(TextAlign.Center)

      }
      .width('100%')
      .height('100%')
      .justifyContent(FlexAlign.Center)
    }
    .height('100%')
  }
}

// 需要添加 import util from '@ohos.util'; // 如果使用 TextDecoder
// 以及可能需要 import { getContext } from '@ohos.abilityAccessCtrl'; 来获取 context
