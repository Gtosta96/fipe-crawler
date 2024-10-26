import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import SQLiteDatabase from "./db/database-sqlite3";
import Crawler from "./crawler/crawler";

export default class CsvCommand {
  private db: SQLiteDatabase;
  private command: Command;

  constructor(db: SQLiteDatabase, command: Command) {
    this.db = db;
    this.command = command;

    this.command
      .name("veiculo:csv")
      .option("-a, --ano <ano>", "Informe ano")
      .option("-m, --mes <mes>", "Informe mês (1 a 12)")
      .option("-t, --tipo <tipo>", "Informe tipo (Carro, Moto, Caminhão)")
      .option("-f, --arquivo <arquivo>", "Informe nome do arquivo")
      .action((options) => this.execute(options));
  }

  private async interact(options: any): Promise<void> {
    const mes = options.mes.padStart(2, "0");
    const ano = options.ano;
    const tiposRev = Object.fromEntries(
      Object.entries(Crawler.tipos).map(([k, v]) => [v, k])
    );
    const tipoDesc = options.tipo;

    if (!tiposRev[tipoDesc]) {
      console.error(`Tipo não encontrado: ${tipoDesc}`);
      process.exit(1);
    }

    const tipo = tiposRev[tipoDesc];
    const arquivo = `fipe_${ano}${mes}_${tipoDesc}.csv`;

    if (!options.arquivo) {
      const question = `Informe nome do arquivo (padrao '${arquivo}'): `;
      const response = await this.ask(question, arquivo);
      options.arquivo = response;
    }
  }

  private async execute(options: any): Promise<void> {
    await this.interact(options);

    const mes = options.mes.padStart(2, "0");
    const ano = options.ano;
    const tiposRev = Object.fromEntries(
      Object.entries(Crawler.tipos).map(([k, v]) => [v, k])
    );
    const tipoDesc = options.tipo;

    if (!tiposRev[tipoDesc]) {
      console.error(`Tipo não encontrado: ${tipoDesc}`);
      process.exit(1);
    }

    const tipo = tiposRev[tipoDesc];
    const arquivo = options.arquivo;
    const descTabela = `tabela ${mes}/${ano}, tipo=[${tipo}] ${tipoDesc}`;

    console.log(`\nRecuperando veículos para ${descTabela}...\n`);

    const veiculos = await this.db.findVeiculos(ano, mes, tipo);
    if (veiculos.length === 0) {
      console.error(`Nenhum veículo encontrado para ${descTabela}`);
      process.exit(1);
    }

    const totalVeiculos = veiculos.length;
    console.log(`Encontrados ${totalVeiculos} veículos para ${descTabela}`);

    let content = this.db.getCsvHeader(veiculos[0], true);
    veiculos.forEach((veiculo, index) => {
      content += `\n${this.db.prepareCsvRow(veiculo, true)}`;
      process.stdout.write(
        `\r ${index + 1}/${totalVeiculos} veículos exportados`
      );
    });

    console.log(`\nExportados ${totalVeiculos} veículos para ${descTabela} !`);

    const filePath = path.join(__dirname, "..", "..", arquivo);
    console.log(`Tentando salvar arquivo ${filePath}...`);
    fs.writeFileSync(filePath, content);
    console.log(`Criado arquivo ${filePath} !\n`);
  }

  private ask(question: string, defaultValue: string): Promise<string> {
    return new Promise((resolve) => {
      process.stdout.write(question);
      process.stdin.once("data", (data) => {
        resolve(data.toString().trim() || defaultValue);
      });
    });
  }
}
