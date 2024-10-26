import API from "./api";

export default class Crawler extends API {
  static tipos = {
    Carro: 1,
    Moto: 2,
    Caminhão: 3,
  } as const;

  constructor() {
    super();
  }

  async getTabelaByAnoMes(
    ano: string,
    mes: string
  ): Promise<{ Codigo: number; Mes: string } | undefined> {
    const tabelas = await this.getTabelas();

    const selectedTabela = tabelas?.find(
      (tabela) => tabela.Mes === `${mes}/${ano} `
    );

    return selectedTabela;
  }

  async getVeiculos(
    tabelaId: number,
    tipo: number,
    marcaValue: string,
    modeloValue: string
  ): Promise<{
    anoModResults: { Label: string; Value: string }[];
    veiculosTotal: number;
    results: {
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
    }[];
  }> {
    const anoModelos = await this.getAnoModelos(
      tabelaId,
      tipo,
      marcaValue,
      modeloValue
    );

    const results = [];
    const failures = [];
    try {
      for (const anoModelo of anoModelos) {
        const [ano, tipoCombustivel] = anoModelo.Value.split("-");
        const veiculo = await this.getVeiculo(
          tabelaId,
          tipo,
          marcaValue,
          modeloValue,
          tipoCombustivel,
          ano
        );

        if (veiculo) {
          results.push(veiculo);
        } else {
          failures.push({ tabelaId, tipo, marcaValue, modeloValue });
        }
      }

      return {
        anoModResults: anoModelos,
        veiculosTotal: results.length,
        results: results,
      };
    } catch (e) {
      return {
        anoModResults: anoModelos,
        veiculosTotal: results.length,
        results: results,
      };
    }
  }
}
