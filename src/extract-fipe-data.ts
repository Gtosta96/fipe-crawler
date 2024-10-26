import SQLiteDatabase from "./db/database-sqlite3";
import API from "./crawler/api";

export default class ExtractFipeData {
  private db: SQLiteDatabase;
  private API: API;

  constructor(db: SQLiteDatabase) {
    this.db = db;
    this.API = new API();
  }

  public async extractTabelaReferencia(): Promise<void> {
    const tabelas = await this.API.getTabelas();
    this.db.saveReferencia(tabelas);
  }
}
