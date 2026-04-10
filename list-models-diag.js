const https = require('https');

const key = 'AIzaSyBAKXpERdRIIGxYzdVpn3cBYQst7WB1HX0';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.models) {
        console.log("MODELOS DISPONÍVEIS:");
        json.models.forEach(m => console.log("- " + m.name.replace('models/', '')));
      } else {
        console.log("ERRO NA RESPOSTA:", data);
      }
    } catch (e) {
      console.log("ERRO AO PROCESSAR JSON:", data);
    }
  });
}).on('error', (err) => {
  console.log("ERRO DE CONEXÃO:", err.message);
});
