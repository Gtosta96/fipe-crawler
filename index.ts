// import { program } from "commander";

import SQLiteDatabase from "./src/db/database-sqlite3";
import ExtractFipeData from "./src/extract-fipe-data";
// import ExtrairVeiculoCommand from "./src/extrair-veiculo-command";
// import CsvCommand from "./src/csv-command";

// const extrairCommand = new ExtrairVeiculoCommand(db, program);
// extrairCommand.run();
// new CsvCommand(db, program);

// program.parse(process.argv);

const db = new SQLiteDatabase("fipe.db");

const extractFipeData = new ExtractFipeData(db);
extractFipeData.extractTabelaReferencia();
