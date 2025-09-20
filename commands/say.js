const { sendchatwork } = require('../utils/chatwork');

async function say(body, message, messageId, roomId, accountId) {
  await sendchatwork(message, roomId);
}

module.exports = {
  say
};
