
// import axios from "axios";

// export const asaasApi = axios.create();

// asaasApi.interceptors.request.use((config) => {
//   const apiKey = process.env.ASAAS_API_KEY;
//   const apiUrl = process.env.ASAAS_API_URL;

//   if (!apiKey || !apiUrl) {
//     // Importante: não quebrar build do Next por validação em nível de módulo.
//     // Valida somente quando a API for realmente chamada.
//     throw new Error("ASAAS_API_KEY e ASAAS_API_URL devem ser definidos");
//   }

//   const token = apiKey.startsWith("$") ? apiKey : `$${apiKey}`;

//   config.baseURL = apiUrl;
//   config.headers = {
//     ...(config.headers ?? {}),
//     access_token: token,
//   };

//   return config;
// });


import axios from "axios";

export const asaasApi = axios.create();

asaasApi.interceptors.request.use((config) => {
  const apiKey = process.env.ASAAS_API_KEY;
  const apiUrl = process.env.ASAAS_API_URL;

  // Não valide em nível de módulo: isso quebra o build do Next no Docker.
  // Valida apenas quando a API for realmente chamada.
  if (!apiKey || !apiUrl) {
    throw new Error("ASAAS_API_KEY e ASAAS_API_URL devem ser definidos");
  }

  // Asaas exige o token com "$" no começo
  const token = apiKey.startsWith("$") ? apiKey : `$${apiKey}`;

  config.baseURL = apiUrl;
  config.headers = {
    ...(config.headers ?? {}),
    access_token: token,
  };

  return config;
});
