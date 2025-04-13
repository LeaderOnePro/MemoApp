import common from '@ohos.app.ability.common';
import { Memo } from '../model/Memo';
import { memoDao } from '../database/MemoDao';
import { preferencesHelper } from '../util/PreferencesHelper';

/**
 * ViewModel for the Memo application.
 * Manages the state for the UI (memo list, font sizes) and interacts with data sources (DAO, Preferences).
 * Needs to be provided with a Context for data operations.
 */
export class MemoViewModel {
  memos: Memo[] = []; // The list of memos displayed in the UI
  titleFontSize: number = 18; // Default title font size
  contentFontSize: number = 14; // Default content font size
  isLoading: boolean = false; // Indicates if data is being loaded
  searchKeyword: string = ''; // Current search keyword
  currentMemo: Memo | null = null; // Holds the memo being edited or added

  private context: common.Context | null = null; // Store context when initialized

  /**
   * Initializes the ViewModel with the necessary context.
   * Must be called before performing data operations.
   * @param context The application or UIAbility context.
   */
  initialize(context: common.Context) {
    this.context = context;
    console.info('MemoViewModel', 'Initialized with context.');
  }

  /**
   * Loads initial data: the list of memos and font size preferences.
   * Should be called when the UI is about to appear.
   */
  async loadInitialData() {
    if (!this.context) {
      console.error('MemoViewModel', 'Context not initialized before loading data.');
      return;
    }
    this.isLoading = true;
    console.info('MemoViewModel', 'Loading initial data...');
    try {
      // Load font sizes first, so the memo list can use them immediately
      await this.loadFontSizes();
      // Load memos based on the current search keyword (initially empty, so loads all)
      await this.searchMemos(this.searchKeyword); // Use searchMemos to handle keyword logic
    } catch (error) {
      console.error('MemoViewModel', `Error loading initial data: ${JSON.stringify(error)}`);
      // Optionally show an error message to the user
    } finally {
      this.isLoading = false;
      console.info('MemoViewModel', 'Initial data loading finished.');
    }
  }

  /**
   * Loads memos from the database based on the provided keyword.
   * If the keyword is empty, loads all memos.
   * @param keyword The keyword to filter memos by title.
   */
  async searchMemos(keyword: string) {
    if (!this.context) {
      console.error('MemoViewModel', 'Context not initialized before searching memos.');
      return;
    }
    this.isLoading = true;
    this.searchKeyword = keyword.trim(); // Update the search keyword state
    console.info('MemoViewModel', `Searching memos with keyword: "${this.searchKeyword}"`);
    try {
      this.memos = await memoDao.queryMemosByTitle(this.context, this.searchKeyword);
      console.info('MemoViewModel', `Found ${this.memos.length} memos.`);
    } catch (error) {
      console.error('MemoViewModel', `Error searching memos: ${JSON.stringify(error)}`);
      this.memos = []; // Clear list on error
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Loads a single memo by ID, intended for the edit page.
   * Sets the currentMemo state.
   * @param id The ID of the memo to load.
   */
  async loadMemoById(id: number) {
    if (!this.context) {
      console.error('MemoViewModel', 'Context not initialized before loading memo by ID.');
      return;
    }
    this.isLoading = true;
    console.info('MemoViewModel', `Loading memo with ID: ${id}...`);
    try {
      this.currentMemo = await memoDao.queryMemoById(this.context, id);
      if (this.currentMemo) {
        console.info('MemoViewModel', 'Memo loaded successfully for editing.');
      } else {
        console.warn('MemoViewModel', `Memo with ID ${id} not found for editing.`);
        // Optionally handle this case, e.g., show error or redirect
      }
    } catch (error) {
      console.error('MemoViewModel', `Error loading memo by ID: ${JSON.stringify(error)}`);
      this.currentMemo = null; // Reset on error
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Prepares the ViewModel for adding a new memo.
   * Clears the currentMemo state.
   */
  prepareNewMemo() {
    this.currentMemo = null;
    console.info('MemoViewModel', 'Prepared for adding a new memo.');
  }

  /**
   * Saves the current memo (either adds a new one or updates an existing one).
   * Called from the MemoEditPage.
   * @param title The title from the input field.
   * @param content The content from the input field.
   * @returns Promise<boolean> indicating success or failure.
   */
  async saveCurrentMemo(title: string, content: string): Promise<boolean> {
    if (!this.context) {
      console.error('MemoViewModel', 'Context not initialized before saving memo.');
      return false;
    }
    this.isLoading = true;
    let success = false;
    try {
      if (this.currentMemo && this.currentMemo.id !== undefined) {
        // Update existing memo
        console.info('MemoViewModel', 'Updating existing memo...');
        const updatedMemo = new Memo(title, content, this.currentMemo.id, this.currentMemo.createdDate, Date.now());
        const affectedRows = await memoDao.updateMemo(this.context, updatedMemo);
        success = affectedRows > 0;
        if (success) {
           console.info('MemoViewModel', 'Memo updated successfully.');
        } else {
           console.error('MemoViewModel', 'Failed to update memo (DAO returned 0 affected rows).');
        }
      } else {
        // Add new memo
        console.info('MemoViewModel', 'Adding new memo...');
        const newMemo = new Memo(title, content);
        const rowId = await memoDao.addMemo(this.context, newMemo);
        success = rowId > 0;
         if (success) {
           console.info('MemoViewModel', 'Memo added successfully.');
        } else {
           console.error('MemoViewModel', 'Failed to add memo (DAO returned invalid rowId).');
        }
      }
      if (success) {
         await this.searchMemos(this.searchKeyword); // Refresh list in the background
      }
    } catch (error) {
      console.error('MemoViewModel', `Error saving memo: ${JSON.stringify(error)}`);
      success = false;
    } finally {
      this.isLoading = false;
    }
    return success;
  }

  /**
   * Deletes a memo from the database and refreshes the list.
   * @param id The ID of the memo to delete.
   */
  async deleteMemo(id: number) {
    if (!this.context) {
      console.error('MemoViewModel', 'Context not initialized before deleting memo.');
      return;
    }
    this.isLoading = true;
    console.info('MemoViewModel', `Deleting memo with ID: ${id}...`);
    try {
      const affectedRows = await memoDao.deleteMemo(this.context, id);
       if (affectedRows > 0) {
        console.info('MemoViewModel', 'Memo deleted successfully. Refreshing list...');
        await this.searchMemos(this.searchKeyword); // Refresh list
      } else {
        console.error('MemoViewModel', 'Failed to delete memo (DAO returned 0 affected rows).');
         // Optionally show an error message
      } 
    } catch (error) {
      console.error('MemoViewModel', `Error deleting memo: ${JSON.stringify(error)}`);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Loads font size settings from preferences.
   */
  async loadFontSizes() {
    if (!this.context) {
      console.error('MemoViewModel', 'Context not initialized before loading font sizes.');
      return;
    }
    console.info('MemoViewModel', 'Loading font sizes...');
    try {
      const { titleSize, contentSize } = await preferencesHelper.loadFontSizes(this.context);
      this.titleFontSize = titleSize;
      this.contentFontSize = contentSize;
      console.info('MemoViewModel', `Font sizes loaded: Title=${titleSize}, Content=${contentSize}`);
    } catch (error) {
      console.error('MemoViewModel', `Error loading font sizes: ${JSON.stringify(error)}`);
      // Keep default values if loading fails
    }
  }

  /**
   * Saves the current font size settings to preferences.
   * (Note: UI needs to trigger this, e.g., via a settings page or directly updating ViewModel properties)
   */
  async saveFontSizes() {
     if (!this.context) {
      console.error('MemoViewModel', 'Context not initialized before saving font sizes.');
      return;
    }
     console.info('MemoViewModel', `Saving font sizes: Title=${this.titleFontSize}, Content=${this.contentFontSize}`);
     try {
       await preferencesHelper.saveFontSizes(this.context, this.titleFontSize, this.contentFontSize);
        console.info('MemoViewModel', 'Font sizes saved successfully.');
     } catch (error) {
        console.error('MemoViewModel', `Error saving font sizes: ${JSON.stringify(error)}`);
     }
  }
} 