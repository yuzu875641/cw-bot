const { sendchatwork } = require('../utils/chatwork');
const { supabase, isUserAdmin } = require('../utils/supabase');

async function addAdmin(body, message, messageId, roomId, accountId) {
  try {
    if (!(await isUserAdmin(accountId, roomId))) {
      return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー: この操作は管理者にしか行えません。`, roomId);
    }
    const { data } = await supabase.from('room_admins').select('accountId').eq('roomId', roomId).eq('accountId', message).single();
    if (data) {
      return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n[piconname:${message}]さんはすでに管理者として登録されています`, roomId);
    }
    await supabase.from('room_admins').insert([{ roomId, accountId: message }]);
    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n[piconname:${message}]さんを管理者として登録しました`, roomId);
  } catch (error) {
    console.error("擬似管理者追加エラー:", error.message);
  }
}

async function removeAdmin(body, message, messageId, roomId, accountId) {
  try {
    if (!(await isUserAdmin(accountId, roomId))) {
      return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー: この操作は管理者にしか行えません。`, roomId);
    }
    await supabase.from('room_admins').delete().eq('roomId', roomId).eq('accountId', message);
    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n[piconname:${message}]さんを管理者から削除しました`, roomId);
  } catch (error) {
    console.error("擬似管理者削除エラー:", error.message);
  }
}

async function gijiAdminList(body, message, messageId, roomId, accountId) {
  try {
    const { data, error } = await supabase.from('room_admins').select('accountId').eq('roomId', roomId);
    if (error) {
      console.error('管理者リスト取得エラー:', error);
      return;
    }
    if (data.length === 0) {
      return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nこのルームには管理者が設定されていません。`, roomId);
    }
    let messageToSend = `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん[info][title]このルームの管理者一覧[/title]`;
    data.forEach(item => { messageToSend += `[piconname:${item.accountId}]\n`; });
    messageToSend += "[/info]";
    await sendchatwork(messageToSend, roomId);
  } catch (error) {
    console.error('管理者リスト送信中のエラー:', error.message);
  }
}

module.exports = {
  addAdmin,
  removeAdmin,
  gijiAdminList
};
