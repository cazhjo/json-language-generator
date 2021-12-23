const fs = require('fs');
const readline = require('readline');
const p = require('path');

const object = {};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function unflatten(data) {
  var result = {};
  for (var i in data) {
    var keys = i.split('.');
    keys.reduce(function (r, e, j) {
      return r[e] || (r[e] = isNaN(Number(keys[j + 1])) ? (keys.length - 1 == j ? data[i] : {}) : []);
    }, result);
  }
  return result;
}

const readFile = async (path) => {
  const fileStream = fs.createReadStream(path);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let formattedIndexStart = -1;
  let formatIndex = -1;
  let idIndex = -1;
  let messageIndex = -1;
  let obj = { id: undefined, defaultMessage: undefined };
  for await (const line of rl) {
    const temp = line;
    if (formattedIndexStart === -1) formattedIndexStart = temp.indexOf('<FormattedMessage');
    if (formatIndex === -1) formatIndex = temp.indexOf('formatMessage(');

    if (formattedIndexStart > -1 || formatIndex > -1) {
      const extra = formattedIndexStart > -1 ? 0 : 1;

      idIndex = temp.indexOf('id');
      messageIndex = temp.indexOf('defaultMessage');
      if (idIndex > -1) {
        const quote = temp.slice(idIndex + 3 + extra, idIndex + 4 + extra);
        obj.id = temp.slice(idIndex + 4 + extra, temp.indexOf(quote, idIndex + 4 + extra));
      }
      if (messageIndex > -1) {
        const quote = temp.slice(messageIndex + 15 + extra, messageIndex + 16 + extra);
        obj.defaultMessage = temp.slice(messageIndex + 16 + extra, temp.indexOf(quote, messageIndex + 16 + extra));
      }

      if (obj.id && obj.defaultMessage) {
        object[obj.id] = obj.defaultMessage;
        obj = { id: undefined, defaultMessage: undefined };
        formattedIndexStart = -1;
      }
    }
  }

  fs.writeFileSync('English.json', JSON.stringify(unflatten(object), null, 2));
};

const readDir = (path) => {
  fs.readdir(path, (err, files) => {
    files.forEach((file) => {
      if (fs.lstatSync(path + '/' + file).isDirectory()) readDir(path + '/' + file);
      else if (p.extname(file) === '.ts' || p.extname(file) === '.tsx') {
        readFile(path + '/' + file);
      }
    });
  });
};

rl.question('src directory path: ', (path) => {
  readDir(path);
  rl.close();
});
