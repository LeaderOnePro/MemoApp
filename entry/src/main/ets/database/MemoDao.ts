import relationalStore from '@ohos.data.relationalStore';
import common from '@ohos.app.ability.common';
import { rdbHelper } from './RdbHelper'; // Import the RdbHelper instance
import { Memo } from '../model/Memo';   // Import the Memo data model

const TABLE_NAME = 'memo'; // Table name constant
const COLUMNS = ['id', 'title', 'content', 'created_date', 'modified_date']; // Column names

/**
 * Data Access Object (DAO) for Memo objects.
 * Provides methods for CRUD operations on the memo table.
 */
class MemoDao {

  /**
   * Inserts a new memo into the database.
   * @param context The application or UIAbility context.
   * @param memo The Memo object to insert. The id property will be ignored.
   * @returns A Promise resolving with the row ID of the newly inserted memo, or -1 on failure.
   */
  async addMemo(context: common.Context, memo: Memo): Promise<number> {
    const store = await rdbHelper.getRdbStore(context);
    const valueBucket: relationalStore.ValuesBucket = {
      title: memo.title,
      content: memo.content,
      created_date: memo.createdDate,
      modified_date: memo.modifiedDate
    };
    try {
      const rowId = await store.insert(TABLE_NAME, valueBucket);
      console.info('MemoDao', `Memo inserted successfully, rowId = ${rowId}`);
      return rowId;
    } catch (e) {
      console.error('MemoDao', `Insert memo failed: ${JSON.stringify(e)}`);
      return -1; // Indicate failure
    }
  }

  /**
   * Queries all memos from the database.
   * @param context The application or UIAbility context.
   * @returns A Promise resolving with an array of Memo objects.
   */
  async queryAllMemos(context: common.Context): Promise<Memo[]> {
    const store = await rdbHelper.getRdbStore(context);
    const predicates = new relationalStore.RdbPredicates(TABLE_NAME);
    // Optional: Order by modified date descending
    predicates.orderByDesc('modified_date');

    try {
      const resultSet = await store.query(predicates, COLUMNS);
      const memos: Memo[] = await this.parseResultSet(resultSet);
      console.info('MemoDao', `Queried ${memos.length} memos.`);
      return memos;
    } catch (e) {
      console.error('MemoDao', `Query all memos failed: ${JSON.stringify(e)}`);
      return []; // Return empty array on error
    }
  }

  /**
   * Queries memos by title keyword (case-insensitive search).
   * @param context The application or UIAbility context.
   * @param keyword The keyword to search for in the memo titles.
   * @returns A Promise resolving with an array of matching Memo objects.
   */
  async queryMemosByTitle(context: common.Context, keyword: string): Promise<Memo[]> {
    if (!keyword) { // If keyword is empty, return all memos
      return this.queryAllMemos(context);
    }
    const store = await rdbHelper.getRdbStore(context);
    const predicates = new relationalStore.RdbPredicates(TABLE_NAME);
    // Use 'like' for wildcard search, '%' matches any sequence of characters
    predicates.like('title', `%${keyword}%`);
    predicates.orderByDesc('modified_date');

    try {
      const resultSet = await store.query(predicates, COLUMNS);
      const memos: Memo[] = await this.parseResultSet(resultSet);
      console.info('MemoDao', `Queried ${memos.length} memos matching keyword "${keyword}".`);
      return memos;
    } catch (e) {
      console.error('MemoDao', `Query memos by title failed: ${JSON.stringify(e)}`);
      return []; // Return empty array on error
    }
  }

  /**
   * Updates an existing memo in the database.
   * @param context The application or UIAbility context.
   * @param memo The Memo object to update. Must have a valid id.
   * @returns A Promise resolving with the number of rows affected (should be 1 if successful, 0 otherwise).
   */
  async updateMemo(context: common.Context, memo: Memo): Promise<number> {
    if (memo.id === undefined) {
      console.error('MemoDao', 'Update failed: Memo ID is undefined.');
      return 0;
    }
    const store = await rdbHelper.getRdbStore(context);
    const valueBucket: relationalStore.ValuesBucket = {
      title: memo.title,
      content: memo.content,
      // Update modified date when updating
      modified_date: Date.now() // Or use memo.modifiedDate if it's updated elsewhere
    };
    const predicates = new relationalStore.RdbPredicates(TABLE_NAME);
    predicates.equalTo('id', memo.id);

    try {
      const affectedRows = await store.update(valueBucket, predicates);
      console.info('MemoDao', `Memo updated successfully, affected rows = ${affectedRows}`);
      return affectedRows;
    } catch (e) {
      console.error('MemoDao', `Update memo failed: ${JSON.stringify(e)}`);
      return 0; // Indicate failure
    }
  }

  /**
   * Deletes a memo from the database by its ID.
   * @param context The application or UIAbility context.
   * @param id The ID of the memo to delete.
   * @returns A Promise resolving with the number of rows deleted (should be 1 if successful, 0 otherwise).
   */
  async deleteMemo(context: common.Context, id: number): Promise<number> {
    const store = await rdbHelper.getRdbStore(context);
    const predicates = new relationalStore.RdbPredicates(TABLE_NAME);
    predicates.equalTo('id', id);

    try {
      const affectedRows = await store.delete(predicates);
      console.info('MemoDao', `Memo deleted successfully, affected rows = ${affectedRows}`);
      return affectedRows;
    } catch (e) {
      console.error('MemoDao', `Delete memo failed: ${JSON.stringify(e)}`);
      return 0; // Indicate failure
    }
  }

  /**
   * Queries a single memo by its ID.
   * @param context The application or UIAbility context.
   * @param id The ID of the memo to query.
   * @returns A Promise resolving with the Memo object if found, otherwise null.
   */
  async queryMemoById(context: common.Context, id: number): Promise<Memo | null> {
    const store = await rdbHelper.getRdbStore(context);
    const predicates = new relationalStore.RdbPredicates(TABLE_NAME);
    predicates.equalTo('id', id);

    let resultSet: relationalStore.ResultSet | null = null;
    try {
      resultSet = await store.query(predicates, COLUMNS);
      if (resultSet && resultSet.rowCount > 0 && resultSet.goToFirstRow()) {
        // Parse the single result
        const memoId = resultSet.getLong(resultSet.getColumnIndex('id'));
        const title = resultSet.getString(resultSet.getColumnIndex('title'));
        const content = resultSet.getString(resultSet.getColumnIndex('content'));
        const createdDate = resultSet.getLong(resultSet.getColumnIndex('created_date'));
        const modifiedDate = resultSet.getLong(resultSet.getColumnIndex('modified_date'));
        console.info('MemoDao', `Found memo with ID: ${id}`);
        return new Memo(title, content, memoId, createdDate, modifiedDate);
      } else {
        console.warn('MemoDao', `Memo with ID ${id} not found.`);
        return null;
      }
    } catch (e) {
      console.error('MemoDao', `Query memo by ID failed: ${JSON.stringify(e)}`);
      return null; // Return null on error
    } finally {
      // IMPORTANT: Always close the ResultSet.
      if (resultSet) {
        try {
          await resultSet.close();
          console.info('MemoDao', 'ResultSet closed for queryMemoById.');
        } catch (closeError) {
          console.error('MemoDao', `Failed to close ResultSet in queryMemoById: ${JSON.stringify(closeError)}`);
        }
      }
    }
  }

  /**
   * Helper function to parse a ResultSet into an array of Memo objects.
   * Remember to close the resultSet after calling this.
   * @param resultSet The ResultSet obtained from a query.
   * @returns A Promise resolving with an array of Memo objects.
   */
  private async parseResultSet(resultSet: relationalStore.ResultSet): Promise<Memo[]> {
    const memos: Memo[] = [];
    if (!resultSet) {
        console.warn('MemoDao', 'parseResultSet received null or undefined resultSet');
        return memos;
    }
    try {
      console.info('MemoDao', `Parsing ResultSet, row count: ${resultSet.rowCount}`);
      if (resultSet.rowCount === 0) {
        return memos;
      }
      // Go to the first row before iterating
      if (!resultSet.goToFirstRow()) {
        console.warn('MemoDao', 'ResultSet is empty or failed to go to the first row.');
        return memos;
      }
      do {
        const id = resultSet.getLong(resultSet.getColumnIndex('id'));
        const title = resultSet.getString(resultSet.getColumnIndex('title'));
        const content = resultSet.getString(resultSet.getColumnIndex('content'));
        const createdDate = resultSet.getLong(resultSet.getColumnIndex('created_date'));
        const modifiedDate = resultSet.getLong(resultSet.getColumnIndex('modified_date'));
        const memo = new Memo(title, content, id, createdDate, modifiedDate);
        memos.push(memo);
      } while (resultSet.goToNextRow()); // Move to the next row
    } catch(e) {
      console.error('MemoDao', `Error parsing ResultSet: ${JSON.stringify(e)}`);
    } finally {
      // IMPORTANT: Always close the ResultSet when done.
      try {
        await resultSet.close(); // Use await if close is async, otherwise remove await
        console.info('MemoDao', 'ResultSet closed.');
      } catch (closeError) {
         console.error('MemoDao', `Failed to close ResultSet: ${JSON.stringify(closeError)}`);
      }
    }
    return memos;
  }
}

// Export a single instance (Singleton pattern)
export const memoDao = new MemoDao(); 