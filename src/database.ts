import { createConnection, Connection, RowDataPacket } from "mysql2/promise";

export class Database {
  private conn: Connection | null = null;

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

  constructor(
    private host: string,
    private dbname: string,
    private user: string,
    private pass: string
  ) {
    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      this.conn = await createConnection({
        host: this.host,
        database: this.dbname,
        user: this.user,
        password: this.pass,
      });
    } catch (err) {
      console.error("Connection failed:", err);
    }
  }

  public async saveTabelas(tabelas: { [key: string]: string }): Promise<any[]> {
    const results: any[] = [];
    const sql = `INSERT INTO tabela (id, desc, ano, mes) VALUES (?, ?, ?, ?)`;

    for (const [id, desc] of Object.entries(tabelas)) {
      const [mes, ano] = desc.split("/");
      const mesCode = Database.meses[mes];
      const mesesFlip = this.flipObject(Database.meses);

      const record = [id, `${mesesFlip[mesCode]}/${ano}`, ano, mesCode];
      await this.conn?.execute(sql, record);
      results.push({ id, desc, ano, mesCode });
    }

    return results;
  }

  public async saveMarcas(
    marcas: { [key: string]: string },
    tipo: string
  ): Promise<any[]> {
    const results: any[] = [];
    const sql = `INSERT INTO marca (id, desc, tipo) VALUES (?, ?, ?)`;

    for (const [id, desc] of Object.entries(marcas)) {
      const record = [id, desc, tipo];
      await this.conn?.execute(sql, record);
      results.push({ id, desc, tipo });
    }

    return results;
  }

  public async saveModelos(
    modelos: { [key: string]: string },
    marcaId: number
  ): Promise<any[]> {
    const results: any[] = [];
    const sql = `INSERT INTO modelo (id, marca_id, desc) VALUES (?, ?, ?)`;

    for (const [id, desc] of Object.entries(modelos)) {
      const record = [id, marcaId, desc];
      await this.conn?.execute(sql, record);
      results.push({ id, marcaId, desc });
    }

    return results;
  }

  public async saveAnoModelos(
    anoMods: { [key: string]: string },
    tabelaId: number,
    marcaId: number,
    modeloId: number
  ): Promise<any[]> {
    const results: any[] = [];
    const sql = `INSERT INTO anomod (modelo_id, desc, anomod_cod, ano, comb, comb_cod) VALUES (?, ?, ?, ?, ?, ?)`;
    const sqlRef = `INSERT INTO ref_tab_mar_mod_ano (tabela_id, marca_id, modelo_id, anomod_id) VALUES (?, ?, ?, ?)`;

    for (const [anoMod, desc] of Object.entries(anoMods)) {
      const [ano, combCod] = anoMod.split("-");
      const comb = Database.combustiveis[parseInt(combCod, 10)] || "";
      const record = [modeloId, desc, anoMod, ano, comb, combCod];
      await this.conn?.execute(sql, record);

      const anomodId = (await this.conn?.query(
        "SELECT LAST_INSERT_ID()"
      )) as RowDataPacket[];
      const refRecord = [
        tabelaId,
        marcaId,
        modeloId,
        anomodId[0]["LAST_INSERT_ID()"],
      ];
      await this.conn?.execute(sqlRef, refRecord);

      results.push({ modeloId, desc, anoMod, ano, comb, combCod });
    }

    return results;
  }

  public async saveVeiculos(veiculos: any[], anoModId: string): Promise<any[]> {
    const results: any[] = [];
    const sql = `INSERT INTO veiculo (fipe_cod, tabela_id, marca_id, anomod_id, tipo, modelo, comb_cod, comb_sigla, comb, valor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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
      await this.conn?.execute(sql, record);
      results.push(record);
    }

    return results;
  }

  private flipObject(obj: { [key: string]: string }): {
    [key: string]: string;
  } {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));
  }
}
