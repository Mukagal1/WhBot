const { create } = require('@wppconnect-team/wppconnect');

async function initClient(sessionName) {
  const client = await create({
    session: sessionName,
    puppeteerOptions: {
      headless: true,
      args: ['--no-sandbox']
    },
    logQR: true,
    browserArgs: ['--no-sandbox'],
    qrLogSkip: false,          // не пропускаем вывод QR
    autoClose: false,
    disableWelcome: true,
    updatesLog: false,
  });
  return client;
}
