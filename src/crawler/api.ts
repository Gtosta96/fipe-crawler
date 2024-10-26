import axios from "axios";

export default class API {
  static urls = {
    tabelas:
      "https://veiculos.fipe.org.br/api/veiculos/ConsultarTabelaDeReferencia",
    marcas: "https://veiculos.fipe.org.br/api/veiculos/ConsultarMarcas",
    modelos: "https://veiculos.fipe.org.br/api/veiculos/ConsultarModelos",
    anoModelos: "https://veiculos.fipe.org.br/api/veiculos/ConsultarAnoModelo",
    veiculo:
      "https://veiculos.fipe.org.br/api/veiculos/ConsultarValorComTodosParametros",
  } as const;

  constructor() {}

  async getTabelas(): Promise<{ Codigo: number; Mes: string }[]> {
    const response = await axios.post(API.urls.tabelas);

    return response.data;
  }

  async getMarcas(
    tabelaId: number,
    tipo: number
  ): Promise<{ Label: string; Value: string }[]> {
    const response = await axios.post(API.urls.marcas, {
      codigoTabelaReferencia: tabelaId,
      codigoTipoVeiculo: tipo,
    });

    return response.data;
  }

  async getModelos(
    tabelaId: number,
    tipo: number,
    marcaValue: string
  ): Promise<{
    Anos: { Label: string; Value: string }[];
    Modelos: { Label: string; Value: string }[];
  }> {
    const response = await axios.post(API.urls.modelos, {
      codigoTipoVeiculo: tipo,
      codigoTabelaReferencia: tabelaId,
      codigoModelo: "",
      codigoMarca: marcaValue,
      ano: "",
      codigoTipoCombustivel: "",
      anoModelo: "",
      modeloCodigoExterno: "",
    });

    return response.data;
  }

  async getAnoModelos(
    tabelaId: number,
    tipo: number,
    marcaValue: string,
    modeloValue: string
  ): Promise<{ Label: string; Value: string }[]> {
    const response = await axios.post(API.urls.anoModelos, {
      codigoTipoVeiculo: tipo,
      codigoTabelaReferencia: tabelaId,
      codigoModelo: modeloValue,
      codigoMarca: marcaValue,
      ano: "",
      codigoTipoCombustivel: "",
      anoModelo: "",
      modeloCodigoExterno: "",
    });

    return response.data;
  }

  async getVeiculo(
    tabelaId: number,
    tipo: number,
    marcaValue: string,
    modeloValue: string,
    combustivel: string,
    ano: string
  ): Promise<{
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
  }> {
    const response = await axios.post(API.urls.veiculo, {
      codigoTipoVeiculo: tipo,
      codigoTabelaReferencia: tabelaId,
      codigoModelo: modeloValue,
      codigoMarca: marcaValue,
      codigoTipoCombustivel: combustivel,
      anoModelo: ano,
      modeloCodigoExterno: "",
      tipoVeiculo: tipo,
      tipoConsulta: "tradicional",
    });

    return response.data;
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
  }
}
