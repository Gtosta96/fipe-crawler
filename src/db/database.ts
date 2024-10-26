import { Pool } from "pg"; // Example using pg-promise for PostgreSQL

export default class Database {
  private conn: Pool;

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

  constructor(host: string, dbname: string, user: string, pass: string) {
    this.conn = new Pool({
      host: host,
      database: dbname,
      password: pass,
    });
  }

  async saveTabelas(tabelas: { [key: string]: string }): Promise<any[]> {
    const results: any[] = [];
    const sql =
      "INSERT INTO tabela (id, desc, ano, mes) VALUES ($1, $2, $3, $4)";

    for (const [id, desc] of Object.entries(tabelas)) {
      const [mes, ano] = desc.split("/");
      const mesNum = Database.meses[mes];
      const mesFlip = Object.keys(Database.meses).find(
        (key) => Database.meses[key] === mesNum
      );
      const record = [id, `${mesFlip}/${ano}`, ano, mesNum];
      await this.conn.query(sql, record);
      results.push(record);
    }

    return results;
  }

  async saveMarcas(
    marcas: { [key: string]: string },
    tipo: string
  ): Promise<any[]> {
    const results: any[] = [];
    const sql = "INSERT INTO marca (id, desc, tipo) VALUES ($1, $2, $3)";

    for (const [id, desc] of Object.entries(marcas)) {
      const record = [id, desc, tipo];
      await this.conn.query(sql, record);
      results.push(record);
    }

    return results;
  }

  async saveModelos(
    modelos: { [key: string]: string },
    marcaId: number
  ): Promise<any[]> {
    const results: any[] = [];
    const sql = "INSERT INTO modelo (id, marca_id, desc) VALUES ($1, $2, $3)";

    for (const [id, desc] of Object.entries(modelos)) {
      const record = [id, marcaId, desc];
      await this.conn.query(sql, record);
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
      "INSERT INTO anomod (modelo_id, desc, anomod_cod, ano, comb, comb_cod) VALUES ($1, $2, $3, $4, $5, $6)";
    const sqlRef =
      "INSERT INTO ref_tab_mar_mod_ano (tabela_id, marca_id, modelo_id, anomod_id) VALUES ($1, $2, $3, $4)";

    for (const [anoMod, desc] of Object.entries(anoMods)) {
      const [ano, combCod] = anoMod.split("-");
      const comb = Database.combustiveis[parseInt(combCod)] || 0;
      const record = [modeloId, desc, anoMod, ano, comb, combCod];
      await this.conn.query(sql, record);
      const anomodId = (await this.conn.query("SELECT LASTVAL()")).rows[0]
        .lastval;
      await this.conn.query(sqlRef, [tabelaId, marcaId, modeloId, anomodId]);
      results.push({ ...record, id: anomodId });
    }

    return results;
  }

  async saveVeiculos(veiculos: any[], anoModId: string): Promise<any[]> {
    const results: any[] = [];
    const sql =
      "INSERT INTO veiculo (fipe_cod, tabela_id, marca_id, anomod_id, tipo, modelo, comb_cod, comb_sigla, comb, valor) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)";

    for (const veiculo of veiculos) {
      const record = [
        veiculo.fipe_cod,
        veiculo.tabela_id,
        veiculo.marca_id,
        anoModId,
        veiculo.tipo,
        veiculo.modelo,
        veiculo.comb_cod,
        veiculo.comb_sigla,
        veiculo.comb,
        veiculo.valor,
      ];
      await this.conn.query(sql, record);
      const id = (await this.conn.query("SELECT LASTVAL()")).rows[0].lastval;
      results.push({ ...record, id });
    }

    return results;
  }

  async saveVeiculoCompletos(veiculos: any[]): Promise<any[]> {
    const results: any[] = [];
    const sql =
      "INSERT INTO veiculo (fipe_cod, tabela_id, anoref, mesref, tipo, marca_id, marca, modelo_id, modelo, anomod, comb_cod, comb_sigla, comb, valor) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)";

    for (const veiculo of veiculos["results"]) {
      try {
        const record = this.prepareParameters(veiculo);
        await this.conn.query(sql, record);
        veiculo.id = (
          await this.conn.query("SELECT LASTVAL()")
        ).rows[0].lastval;
        results.push(veiculo);
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
      "SELECT * FROM veiculo WHERE anoref = $1 AND mesref = $2 AND tipo = $3";
    const result = await this.conn.query(sql, [anoref, mesref, tipo]);
    return result.rows;
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
    const result = await this.conn.query(sql);
    const tabelasResult = result.rows;
    const mesesFlip = Object.keys(Database.meses).reduce((acc, key) => {
      acc[Database.meses[key]] = key;
      return acc;
    }, {} as { [key: string]: string });
    const tabelas = tabelasResult.map((tab) => {
      const mesref = mesesFlip[tab.mesref.toString().padStart(2, "0")];
      return {
        id: `${tab.tabela_id}-${tab.tipo}`,
        lbl: `${mesref}/${tab.anoref} - ${Database.tipos[tab.tipo]}`,
      };
    });

    return { results: tabelas };
  }

  async findVeiculosByTabelaAndTipo(
    tabela: number,
    tipo: string
  ): Promise<any> {
    const sql = "SELECT * FROM veiculo WHERE tabela_id = $1 AND tipo = $2";
    const result = await this.conn.query(sql, [tabela, tipo]);
    const results = result.rows;
    return {
      results: results,
      header: this.getCsvHeaderArray(results[0]),
    };
  }

  private prepareParameters(record: any): any {
    const preparedRecord: any = {};
    for (const [key, value] of Object.entries(record)) {
      preparedRecord[`:${key}`] = value;
    }
    return preparedRecord;
  }
}
