import preferences from '@ohos.data.preferences';
import common from '@ohos.app.ability.common';

const PREF_FILE_NAME = 'memo_settings'; // Preferences file name
const KEY_TITLE_FONT_SIZE = 'title_font_size';
const KEY_CONTENT_FONT_SIZE = 'content_font_size';

// Default font sizes
const DEFAULT_TITLE_FONT_SIZE = 18;
const DEFAULT_CONTENT_FONT_SIZE = 14;

/**
 * Helper class for managing application preferences using @ohos.data.preferences.
 * Used here to store and retrieve font size settings for the memo app.
 */
class PreferencesHelper {
  private prefInstance: preferences.Preferences | null = null;

  /**
   * Gets the Preferences instance for the application settings.
   * Creates the preferences file if it doesn't exist.
   * @param context The application or UIAbility context.
   * @returns A Promise resolving with the Preferences instance.
   */
  private async getPreferences(context: common.Context): Promise<preferences.Preferences> {
    if (!this.prefInstance) {
      console.info('PreferencesHelper', `Getting preferences instance for ${PREF_FILE_NAME}...`);
      try {
        // Obtain the Preferences instance associated with the context and file name
        this.prefInstance = await preferences.getPreferences(context, PREF_FILE_NAME);
        console.info('PreferencesHelper', 'Preferences instance obtained successfully.');
      } catch (e) {
        console.error('PreferencesHelper', `Get preferences failed: ${JSON.stringify(e)}`);
        // Rethrow or handle the error appropriately
        throw new Error(`Failed to get Preferences: ${e.message}`);
      }
    }
    return this.prefInstance!; // Non-null assertion, error handled in try-catch
  }

  /**
   * Saves the title and content font sizes to preferences.
   * @param context The application or UIAbility context.
   * @param titleSize The title font size to save.
   * @param contentSize The content font size to save.
   * @returns A Promise that resolves when the operation is complete.
   */
  async saveFontSizes(context: common.Context, titleSize: number, contentSize: number): Promise<void> {
    try {
      const prefs = await this.getPreferences(context);
      // Use put() to store key-value pairs. It returns a Promise<void>.
      await prefs.put(KEY_TITLE_FONT_SIZE, titleSize);
      console.info('PreferencesHelper', `Saving ${KEY_TITLE_FONT_SIZE}: ${titleSize}`);
      await prefs.put(KEY_CONTENT_FONT_SIZE, contentSize);
      console.info('PreferencesHelper', `Saving ${KEY_CONTENT_FONT_SIZE}: ${contentSize}`);
      // Use flush() to ensure data is written to the persistent file immediately. It returns a Promise<void>.
      await prefs.flush();
      console.info('PreferencesHelper', 'Font sizes saved and flushed.');
    } catch (e) {
      console.error('PreferencesHelper', `Save font sizes failed: ${JSON.stringify(e)}`);
      // Optionally rethrow or handle the error
    }
  }

  /**
   * Loads the title and content font sizes from preferences.
   * If values are not found, default sizes are returned.
   * @param context The application or UIAbility context.
   * @returns A Promise resolving with an object containing titleSize and contentSize.
   */
  async loadFontSizes(context: common.Context): Promise<{ titleSize: number; contentSize: number }> {
    let titleSize = DEFAULT_TITLE_FONT_SIZE;
    let contentSize = DEFAULT_CONTENT_FONT_SIZE;
    try {
      const prefs = await this.getPreferences(context);
      // Use get() to retrieve values. Provide a default value in case the key doesn't exist.
      // The type of the default value determines the return type (or Promise thereof).
      titleSize = await prefs.get(KEY_TITLE_FONT_SIZE, DEFAULT_TITLE_FONT_SIZE) as number;
      console.info('PreferencesHelper', `Loaded ${KEY_TITLE_FONT_SIZE}: ${titleSize}`);
      contentSize = await prefs.get(KEY_CONTENT_FONT_SIZE, DEFAULT_CONTENT_FONT_SIZE) as number;
      console.info('PreferencesHelper', `Loaded ${KEY_CONTENT_FONT_SIZE}: ${contentSize}`);
    } catch (e) {
      console.error('PreferencesHelper', `Load font sizes failed: ${JSON.stringify(e)}`);
      // Return default values in case of error
    }
    return { titleSize, contentSize };
  }

   // Optional: Method to delete preferences if needed
   // async clearSettings(context: common.Context): Promise<void> {
   //   try {
   //     const prefs = await this.getPreferences(context);
   //     await prefs.clear();
   //     await prefs.flush();
   //     console.info('PreferencesHelper', 'Settings cleared.');
   //   } catch (e) {
   //     console.error('PreferencesHelper', `Clear settings failed: ${JSON.stringify(e)}`);
   //   }
   // }
}

// Export a single instance (Singleton pattern)
export const preferencesHelper = new PreferencesHelper(); 