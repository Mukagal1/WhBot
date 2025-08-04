const { create } = require('@wppconnect-team/wppconnect');

async function initClient(sessionName) {
  const client = await create({
    session: sessionName,
    puppeteerOptions: { headless: true },
  });
  return client;
}

module.exports = initClient;
