import { Command } from "commander";
import SQLiteDatabase from "./db/database-sqlite3";
import Crawler from "./crawler/crawler";
const ProgressBar = require("progress");

export default class ExtrairVeiculoCommand {
  private db: SQLiteDatabase;
  private command: Command;

  constructor(db: SQLiteDatabase, command: Command) {
    this.db = db;
    this.command = command;
  }

  public run() {
    const help =
      "Extrai tabela FIPE informando ano, mês e tipo\n\nSintaxe interativa:\n./fipecrawler extrair:veiculo\n\nSintaxe completa\n./fipecrawler extrair:veiculo ano mes tipo\n";

    this.command
      .name("veiculo:extrair")
      .description("Extrai tabela por ano, mês e tipo")
      .option("-a, --ano <ano>", "Informe ano")
      .option("-m, --mes <mes>", "Informe mês (1 a 12)")
      .option("-t, --tipo <tipo>", "Informe tipo (Carro, Moto, Caminhão)")
      .addHelpText("before", help)
      .action((options) => this.execute(options));
  }

  private fatal(msg: string): void {
    const dash = "-".repeat(80);
    const space = " ".repeat(80);
    const error = "** ERRO FATAL **".padEnd(80, " ");

    console.error("");
    console.error(dash);
    console.error(space);
    console.error(error);
    console.error(space);
    console.error(msg.padEnd(80, " "));
    console.error(space);
    console.error(dash);
    process.exit(1);
  }

  private alert(msg: string): void {
    const dash = "-".repeat(80);
    const space = " ".repeat(80);
    msg = msg.padEnd(80, " ");

    console.log(dash);
    console.log(space);
    console.log(msg);
    console.log(space);
    console.log(dash);
  }

  private seconds2human(seconds: number): string {
    const s = Math.floor(seconds % 60);
    const m = Math.floor((seconds / 60) % 60);
    const h = Math.floor(seconds / 3600);

    return `${h}h${m}m${s}s`;
  }

  private memory2human(memory: number): string {
    if (memory < 1024) {
      return `${memory} bytes`;
    } else if (memory < 1048576) {
      return `${(memory / 1024).toFixed(2)} kilobytes`;
    } else {
      return `${(memory / 1048576).toFixed(2)} megabytes`;
    }
  }

  protected async execute(options: {
    mes: string;
    ano: string;
    tipo: keyof typeof Crawler.tipos;
  }): Promise<void> {
    // await this.interact(options);

    const initialTime = Date.now();
    const initialMemory = process.memoryUsage().heapUsed;

    const mes = options.mes.padStart(2, "0");
    const ano = options.ano;

    const tipoDesc = options.tipo;
    const tipoIndex = Crawler.tipos[options.tipo];

    if (!tipoIndex) {
      return this.fatal(`Tipo não encontrado: ${tipoDesc}`);
    }

    const crawler = new Crawler();

    console.log(`Recuperando tabelas para ${mes}/${ano}...`);

    const tabela = await crawler.getTabelaByAnoMes(ano, mes);
    if (!tabela) {
      return this.fatal(`Não encontrada tabela para ${mes}/${ano}`);
    }

    console.log(`
      Encontrada tabela ${mes}/${ano}!
      tabela id=[${tabela.Codigo}] ${mes}/${ano}, tipo=[${tipoIndex}] ${tipoDesc}
    `);

    const marcas = await crawler.getMarcas(tabela.Codigo, tipoIndex);
    const totalMarcas = marcas.length;

    if (!totalMarcas) {
      return this.fatal(`Não encontrada nenhuma marca!`);
    }

    console.log(`
      Encontradas ${totalMarcas} marcas
      Recuperando modelos para ${totalMarcas} marcas
    `);

    let totalModelos = 0;
    const progress = new ProgressBar(
      " :current/:total [:bar] :ttmod modelos extraídos",
      { total: totalMarcas }
    );
    const modelosByMarca: Record<string, { Label: string; Value: string }[]> =
      {};
    for (const marca of marcas) {
      const modelos = await crawler.getModelos(
        tabela.Codigo,
        tipoIndex,
        marca.Value
      );
      modelosByMarca[marca.Value] = modelos.Modelos;
      totalModelos += modelos.Modelos.length;
      progress.tick({ ttmod: totalModelos });
    }

    console.log(`
      Encontrados ${totalModelos} modelos para ${totalMarcas} marcas
      Recuperando veiculos para para ${totalModelos}
    `);

    let totalVeiculos = 0;
    const progressVeiculos = new ProgressBar(
      " :current/:total [:bar] :ttvei veículos extraídos",
      { total: totalModelos }
    );

    for (const [marcaValue, marcaModelos] of Object.entries(modelosByMarca)) {
      for (const modelo of marcaModelos) {
        const tmpVeiculos = await crawler.getVeiculos(
          tabela.Codigo,
          tipoIndex,
          marcaValue,
          modelo.Value
        );

        await this.db.saveVeiculoCompletos(tmpVeiculos.results);
        totalVeiculos += tmpVeiculos.veiculosTotal;
        progressVeiculos.tick({ ttvei: totalVeiculos });
      }
    }

    console.log(`
      Extraídos ${totalVeiculos} veículos
    `);

    const finalTime = Date.now();
    const finalMemory = process.memoryUsage().heapUsed;

    const duration = this.seconds2human(finalTime - initialTime);
    const memory = this.memory2human(finalMemory - initialMemory);
    this.alert(
      `FIPE Crawler executado com sucesso em ${duration}, memória ${memory}`
    );
  }

  // private banner(): void {
  //   const dash = "-".repeat(80);
  //   const space = " ".repeat(80);

  //   console.log(dash);
  //   console.log(space);

  //   let msg = `  ${this.command.name()}`.padEnd(80, " ");
  //   console.log(msg);

  //   msg = `  ${this.command.description()}`.padEnd(80, " ");
  //   console.log(msg);

  //   console.log(space);
  //   console.log(dash);
  // }

  // private async interact(options: any): Promise<void> {
  //   this.banner();

  //   const date = new Date();

  //   if (!options.ano) {
  //     const anos = Array.from({ length: date.getFullYear() - 2000 }, (_, i) =>
  //       (date.getFullYear() - i).toString()
  //     );
  //     options.ano = await this.promptChoice(
  //       "Informe ano (ENTER para " + date.getFullYear() + ")",
  //       anos,
  //       date.getFullYear().toString()
  //     );
  //   }

  //   if (!options.mes) {
  //     const meses = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  //     options.mes = await this.promptChoice(
  //       "Informe mês (1 a 12) (ENTER para " + (date.getMonth() + 1) + ")",
  //       meses,
  //       (date.getMonth() + 1).toString()
  //     );
  //   }

  //   if (!options.tipo) {
  //     options.tipo = await this.promptChoice(
  //       "Informe tipo (1 = carro, 2 = moto, 3 = caminhão) (ENTER para Carro)",
  //       Crawler.tipos,
  //       "1"
  //     );
  //   }
  // }

  // private async promptChoice(
  //   message: string,
  //   choices: string[],
  //   defaultValue: string
  // ): Promise<string> {
  //   // Implement a method to prompt the user for input
  //   // This is a placeholder implementation
  //   return defaultValue;
  // }
}
