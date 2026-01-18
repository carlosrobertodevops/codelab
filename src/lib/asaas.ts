// import axios from "axios";

// const apiKey = "$" + process.env.ASAAS_API_KEY;
// const apiUrl = process.env.ASAAS_API_URL;

// if (!apiKey || !apiUrl) {
//   throw new Error("ASAAS_API_KEY e ASAAS_API_URL devem ser definidos");
// }

// export const asaasApi = axios.create({
//   baseURL: apiUrl,
//   headers: {
//     access_token: apiKey,
//   },
// });
import axios from "axios";

export const asaasApi = axios.create();

asaasApi.interceptors.request.use((config) => {
  const apiKey = process.env.ASAAS_API_KEY;
  const apiUrl = process.env.ASAAS_API_URL;

  if (!apiKey || !apiUrl) {
    // Importante: não quebrar build do Next por validação em nível de módulo.
    // Valida somente quando a API for realmente chamada.
    throw new Error("ASAAS_API_KEY e ASAAS_API_URL devem ser definidos");
  }

  const token = apiKey.startsWith("$") ? apiKey : `$${apiKey}`;

  config.baseURL = apiUrl;
  config.headers = {
    ...(config.headers ?? {}),
    access_token: token,
  };

  return config;
});
