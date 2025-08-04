const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const schedule = require('node-schedule');
const initClient1 = require('./clients/client1');
const initClient2 = require('./clients/client2');

const FILE = 'contacts.csv';
const clients = [];
let contacts = [];
let isSending = false;

async function startClients() {
  clients.push({ id: 1, client: await initClient1('client1') });
  clients.push({ id: 2, client: await initClient2('client2') });
  console.log('Клиенты инициализированы');
}

function getRandomDelay() {
  return Math.floor(Math.random() * (25000 - 15000 + 1)) + 15000;
}

function readCsv() {
  return new Promise((resolve) => {
    const results = [];
    fs.createReadStream(FILE)
      .pipe(csv({ separator: ';', mapHeaders: ({ header }) => header.trim() }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results));
  });
}

function saveCsv(data) {
  const csvWriter = createObjectCsvWriter({
    path: FILE,
    header: [
      { id: 'Name', title: 'Name' },
      { id: 'Address', title: 'Address' },
      { id: 'Phones', title: 'Phones' },
      { id: 'Status', title: 'Status' },
      { id: 'AccountID', title: 'AccountID' },
    ],
    fieldDelimiter: ';'
  });

  return csvWriter.writeRecords(data);
}

function normalizePhone(phone) {
  return phone.replace(/\D/g, '');
}

function startListeningResponses() {
  for (const { client } of clients) {
    client.onMessage(async (message) => {
      if (!message.from.endsWith('@c.us')) return;

      const sender = message.from.replace('@c.us', '');
      const normalized = normalizePhone(sender);

      const contact = contacts.find(c => normalizePhone(c.Phones) === normalized);
      if (contact && contact.Status !== '+') {
        contact.Status = '+';
        await saveCsv(contacts);
        console.log(`Ответ получен от ${contact.Name} (${normalized}) — статус обновлён`);
      }
    });
  }
}

async function sendMessages() {
  if (isSending) {
    console.log('Рассылка уже идёт, пропускаем запуск...');
    return;
  }

  isSending = true;
  try {
    contacts = await readCsv();

    // Заполняем пустые поля
    let accId = 1;
    for (let contact of contacts) {
      if (!contact.Status || contact.Status.trim() === '') contact.Status = '-';
      if (!contact.AccountID || contact.AccountID.trim() === '') {
        contact.AccountID = accId.toString();
        accId = accId % 2 + 1;
      }
    }

    for (let contact of contacts) {
      if (contact.Status !== '-') continue;

      const phone = normalizePhone(contact.Phones);
      const number = `${phone}@c.us`;

      let ids = contact.AccountID.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      if (ids.length === 0) ids = [1];
      const lastId = ids[ids.length - 1];
      const lastIndex = lastId - 1;

      const message = `Здравствуйте, ${contact.Name}! Мы находимся по адресу: ${contact.Address}`;
      let sent = false;

      try {
        await clients[lastIndex].client.sendText(number, message);
        console.log(`Сообщение ${phone} отправлено через аккаунт ${lastId}`);
        sent = true;
      } catch (e) {
        console.warn(`Ошибка на аккаунте ${lastId} для ${phone}: ${e.message}`);
      }

      if (!sent) {
        if (ids.length >= 2) {
          contact.Status = '+';
          console.warn(`${phone}: оба аккаунта пробовались, статус '+'`);
        } else {
          const otherId = lastId === 1 ? 2 : 1;
          ids.push(otherId);
          contact.AccountID = ids.join(',');

          const otherIndex = otherId - 1;
          try {
            await clients[otherIndex].client.sendText(number, message);
            console.log(`Сообщение ${phone} отправлено через аккаунт ${otherId}`);
            sent = true;
          } catch (e) {
            console.warn(`Ошибка на втором аккаунте ${otherId} для ${phone}: ${e.message}`);
            contact.Status = '+';
          }
        }
      }

      const delay = getRandomDelay();
      console.log(`Ждём ${delay / 1000} сек перед следующим сообщением...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    await saveCsv(contacts);
    console.log('CSV обновлён');
  } catch (err) {
    console.error('Ошибка во время рассылки:', err);
  } finally {
    isSending = false;
  }
}

async function run() {
  await startClients();              // запускаем клиентов один раз
  await sendMessages();             // первая рассылка
  startListeningResponses();        // слушаем ответы

  // Плановая рассылка каждые 5 минут
  schedule.scheduleJob('*/5 * * * *', async () => {
    console.log('Расписание: каждые 5 минут');
    await sendMessages();
  });
}

run();
