/**
 * Represents a single memo note.
 */
export class Memo {
  id?: number; // Optional: Database will auto-increment this
  title: string;
  content: string;
  createdDate: number; // Store as timestamp (milliseconds since epoch)
  modifiedDate: number; // Store as timestamp

  constructor(title: string, content: string, id?: number, createdDate?: number, modifiedDate?: number) {
    this.id = id;
    this.title = title;
    this.content = content;
    const now = Date.now();
    this.createdDate = createdDate ?? now;
    this.modifiedDate = modifiedDate ?? now;
  }
} 