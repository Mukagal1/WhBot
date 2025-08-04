const { create } = require('@wppconnect-team/wppconnect');

async function initClient(sessionName) {
  const client = await create({
    session: sessionName,
    puppeteerOptions: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
  });
  return client;
}

module.exports = initClient;
