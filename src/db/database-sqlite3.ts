import sqlite3 from "sqlite3";
sqlite3.verbose();

export default class SQLiteDatabase {
  private conn: sqlite3.Database;

  public static meses: { [key: string]: string } = {
    janeiro: "01",
    fevereiro: "02",
    março: "03",
    abril: "04",
    maio: "05",
    junho: "06",
    julho: "07",
    agosto: "08",
    setembro: "09",
    outubro: "10",
    novembro: "11",
    dezembro: "12",
  };

  public static combustiveis: { [key: number]: string } = {
    1: "Gasolina",
    2: "Álcool",
    3: "Diesel",
    4: "Flex",
  };

  public static tipos: { [key: number]: string } = {
    1: "Carro",
    2: "Moto",
    3: "Caminhão",
  };

  constructor(dbPath: string) {
    this.conn = new sqlite3.Database(dbPath);

    this.conn.run(
      `
      CREATE TABLE IF NOT EXISTS referencia (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Codigo INTEGER NOT NULL,
        Mes TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS veiculo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        CodigoFipe TEXT NOT NULL,
        Marca TEXT NOT NULL,
        Modelo TEXT NOT NULL,
        AnoModelo INTEGER NOT NULL,
        MesReferencia TEXT NOT NULL,
        Valor TEXT NOT NULL,
        TipoVeiculo INTEGER NOT NULL,
        Combustivel TEXT  NOT NULL,
        SiglaCombustivel TEXT NOT NULL
      );
      `
    );
  }

  async saveReferencia(
    referencias: { Codigo: number; Mes: string }[]
  ): Promise<string> {
    const sql = "INSERT INTO referencia (Codigo, Mes) VALUES (?, ?)";

    for (const referencia of referencias) {
      const record = [referencia.Codigo, referencia.Mes];
      const q = await this.runQuery(sql, record);
      console.log(q);
    }

    return "success";
  }

  async saveMarcas(
    marcas: { [key: string]: string },
    tipo: string
  ): Promise<any[]> {
    const results: any[] = [];
    const sql = "INSERT INTO marca (id, desc, tipo) VALUES (?, ?, ?)";

    for (const [id, desc] of Object.entries(marcas)) {
      const record = [id, desc, tipo];
      await this.runQuery(sql, record);
      results.push(record);
    }

    return results;
  }

  async saveModelos(
    modelos: { [key: string]: string },
    marcaId: number
  ): Promise<any[]> {
    const results: any[] = [];
    const sql = "INSERT INTO modelo (id, marca_id, desc) VALUES (?, ?, ?)";

    for (const [id, desc] of Object.entries(modelos)) {
      const record = [id, marcaId, desc];
      await this.runQuery(sql, record);
      results.push(record);
    }

    return results;
  }

  async saveAnoModelos(
    anoMods: { [key: string]: string },
    tabelaId: number,
    marcaId: number,
    modeloId: number
  ): Promise<any[]> {
    const results: any[] = [];
    const sql =
      "INSERT INTO anomod (modelo_id, desc, anomod_cod, ano, comb, comb_cod) VALUES (?, ?, ?, ?, ?, ?)";
    const sqlRef =
      "INSERT INTO ref_tab_mar_mod_ano (tabela_id, marca_id, modelo_id, anomod_id) VALUES (?, ?, ?, ?)";

    for (const [anoMod, desc] of Object.entries(anoMods)) {
      const [ano, combCod] = anoMod.split("-");
      const comb = SQLiteDatabase.combustiveis[parseInt(combCod)] || 0;
      const record = [modeloId, desc, anoMod, ano, comb, combCod];
      // await this.runQuery(sql, record);
      // const anomodId = await this.getLastInsertId();
      // await this.runQuery(sqlRef, [tabelaId, marcaId, modeloId, anomodId]);
      // results.push({ ...record, id: anomodId });
    }

    return results;
  }

  async saveVeiculoCompletos(
    veiculos: {
      AnoModelo: number;
      Autenticacao: string;
      CodigoFipe: string;
      Combustivel: string;
      DataConsulta: string;
      Marca: string;
      MesReferencia: string;
      Modelo: string;
      SiglaCombustivel: string;
      TipoVeiculo: number;
      Valor: string;
    }[]
  ): Promise<any[]> {
    const results: any[] = [];
    const sql =
      "INSERT INTO veiculo (CodigoFipe, Marca, Modelo, AnoModelo, MesReferencia, Valor, TipoVeiculo, Combustivel, SiglaCombustivel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    for (const veiculo of veiculos) {
      try {
        const record = [
          veiculo.CodigoFipe,
          veiculo.Marca,
          veiculo.Modelo,
          veiculo.AnoModelo,
          veiculo.MesReferencia,
          veiculo.Valor,
          veiculo.TipoVeiculo,
          veiculo.Combustivel,
          veiculo.SiglaCombustivel,
        ];

        const result = await this.runQuery(sql, record);
        console.log(result);
      } catch (e) {
        // Ignore
      }
    }

    return results;
  }

  async findVeiculos(
    anoref: string,
    mesref: string,
    tipo: string
  ): Promise<any[]> {
    const sql =
      "SELECT * FROM veiculo WHERE anoref = ? AND mesref = ? AND tipo = ?";
    const result = await this.runQuery(sql, [anoref, mesref, tipo]);
    return result;
  }

  getCsvHeader(
    row: any,
    noId: boolean = false,
    separator: string = ","
  ): string {
    const headerArray = this.getCsvHeaderArray(row, noId);
    return headerArray.join(separator);
  }

  getCsvHeaderArray(row: any, noId: boolean = false): string[] {
    if (noId) {
      delete row.id;
    }
    return Object.keys(row);
  }

  prepareCsvRow(
    row: any,
    noId: boolean = false,
    separator: string = ","
  ): string {
    if (noId) {
      delete row.id;
    }
    return Object.values(row).join(separator);
  }

  async findTabelas(): Promise<any> {
    const sql =
      "SELECT DISTINCT tabela_id, anoref, mesref, tipo FROM veiculo ORDER BY anoref DESC, mesref DESC, tipo";
    const result = await this.runQuery(sql);
    const tabelasResult = result;
    const mesesFlip = Object.keys(SQLiteDatabase.meses).reduce((acc, key) => {
      acc[SQLiteDatabase.meses[key]] = key;
      return acc;
    }, {} as { [key: string]: string });
    const tabelas = tabelasResult.map((tab) => {
      const mesref = mesesFlip[tab.mesref.toString().padStart(2, "0")];
      return {
        id: `${tab.tabela_id}-${tab.tipo}`,
        lbl: `${mesref}/${tab.anoref} - ${SQLiteDatabase.tipos[tab.tipo]}`,
      };
    });

    return { results: tabelas };
  }

  async findVeiculosByTabelaAndTipo(
    tabela: number,
    tipo: string
  ): Promise<any> {
    const sql = "SELECT * FROM veiculo WHERE tabela_id = ? AND tipo = ?";
    const result = await this.runQuery(sql, [tabela, tipo]);
    const results = result;
    return {
      results: results,
      header: this.getCsvHeaderArray(results[0]),
    };
  }

  private runQuery(sql: string, params: unknown[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.conn.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}
