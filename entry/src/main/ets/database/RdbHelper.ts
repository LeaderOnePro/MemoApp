import relationalStore from '@ohos.data.relationalStore';
import common from '@ohos.app.ability.common'; // Import common for Context type

// Database configuration
const STORE_CONFIG = {
  name: 'MemoDB.db', // Database file name
  securityLevel: relationalStore.SecurityLevel.S1 // Security level
};

// SQL statement to create the memo table
const SQL_CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS memo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  created_date INTEGER NOT NULL,
  modified_date INTEGER NOT NULL
)`;

/**
 * Helper class for managing the relational database (RDB) store.
 * Handles database creation, version upgrades, and provides access to the RDB store instance.
 */
class RdbHelper {
  private rdbStore: relationalStore.RdbStore | null = null;

  /**
   * Gets the RDB store instance. Creates the database and table if they don't exist.
   * @param context The application or UIAbility context.
   * @returns A Promise that resolves with the RdbStore instance.
   */
  async getRdbStore(context: common.Context): Promise<relationalStore.RdbStore> { // Use common.Context
    if (!this.rdbStore) {
      console.info('RdbHelper', 'Getting RDB store...');
      try {
        // RDB open callback for handling database creation and upgrades
        const RdbOpenCallback: relationalStore.RdbOpenCallback = {
          onCreate: (store: relationalStore.RdbStore) => {
            console.info('RdbHelper', 'Database creating...');
            store.executeSql(SQL_CREATE_TABLE);
            console.info('RdbHelper', 'Table created successfully using executeSql.');
          },
          onUpgrade: (store: relationalStore.RdbStore, oldVersion: number, newVersion: number) => {
            console.info('RdbHelper', `Database upgrading from ${oldVersion} to ${newVersion}`);
            // Add database upgrade logic here if needed in the future
            // Example: store.executeSql('DROP TABLE IF EXISTS memo'); onCreate(store);
          }
          // onDowngrade, onOpen can be added if needed
        };
        // Obtain the RDB store instance
        this.rdbStore = await relationalStore.getRdbStore(context, STORE_CONFIG, RdbOpenCallback);
        console.info('RdbHelper', 'Database store obtained successfully.');
      } catch (e) {
        console.error('RdbHelper', `Get RDB store failed, error: ${JSON.stringify(e)}`);
        // Rethrow or handle the error appropriately
        throw new Error(`Failed to get RDB store: ${e.message}`);
      }
    } else {
       console.info('RdbHelper', 'Returning existing RDB store instance.');
    }
    return this.rdbStore!; // Non-null assertion, as we throw an error if creation fails
  }

  // Optional: Method to close the database if needed, e.g., on application exit
  // closeStore() {
  //   if (this.rdbStore) {
  //     // Closing logic might be needed in specific scenarios,
  //     // but often managed by the system. Check documentation.
  //     console.info('RdbHelper', 'Closing RDB store (if applicable).');
  //     // this.rdbStore.close(); // Check if close method exists and is needed
  //     this.rdbStore = null;
  //   }
  // }
}

// Export a single instance (Singleton pattern)
export const rdbHelper = new RdbHelper(); 