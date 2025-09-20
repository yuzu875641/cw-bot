const { sendchatwork } = require('../utils/chatwork');
const { supabase, isUserAdmin, checkAgijidmin } = require('../utils/supabase');

async function save(body, message, messageId, roomId, accountId) {
  const match = message.match(/^([^「]+)「(.+)」$/);
  if (!match) {
    return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n構文エラー`, roomId);
  }
  const [_, triggerMessage, responseMessage] = match;
  const isAdmin = await checkAgijidmin(roomId, accountId) || await isUserAdmin(accountId, roomId);
  if (!isAdmin) {
    return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー: この操作は管理者にしか行えません。`, roomId);
  }
  const { error } = await supabase.from('text').insert([{ roomId, triggerMessage, responseMessage }]);
  if (error) {
    return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nデータを保存できませんでした`, roomId);
  } else {
    return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nデータを保存しました！`, roomId);
  }
}

async function deleteData(body, triggerMessage, messageId, roomId, accountId) {
  const isAdmin = await checkAgijidmin(roomId, accountId) || await isUserAdmin(accountId, roomId);
  if (!isAdmin) {
    return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー: この操作は管理者にしか行えません。`, roomId);
  }
  const { error } = await supabase.from('text').delete().eq('roomId', roomId).eq('triggerMessage', triggerMessage);
  if (error) {
    return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n削除しようとしているデータが見つかりません。settingコマンドを使って保存中のデータを閲覧できます。`, roomId);
  } else {
    return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n削除しました`, roomId);
  }
}

async function Settings(body, triggerMessage, messageId, roomId, accountId) {
  const { data, error } = await supabase.from('text').select('triggerMessage, responseMessage').eq('roomId', roomId);
  if (error) {
    console.error('設定取得エラー:', error);
  } else {
    if (data.length === 0) {
      return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nこのルームに設定されたメッセージはありません`, roomId);
    } else {
      let messageToSend = `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん[info][title]設定されたメッセージ[/title]`;
      data.forEach(item => { messageToSend += `${item.triggerMessage} - ${item.responseMessage}\n`; });
      messageToSend += "[/info]";
      return sendchatwork(messageToSend, roomId);
    }
  }
}

module.exports = {
  save,
  deleteData,
  Settings
};
