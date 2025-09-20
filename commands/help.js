const { sendchatwork } = require('../utils/chatwork');

async function wakamehelp(body, message, messageId, roomId, accountId) {
  await sendchatwork(
    `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん[info][title]ヘルプ[/title]/help/\nコマンドリストを表示します。[/info]`,
    roomId
  );
}

module.exports = {
  wakamehelp
};
