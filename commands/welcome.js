const { sendchatwork } = require('../utils/chatwork');
const { supabase, isUserAdmin, checkAgijidmin } = require('../utils/supabase');

async function welcome(message, roomId) {
  const welcomeId = (message.match(/\[piconname:(\d+)\]/) || [])[1];
  if (!welcomeId) return;
  const { data, error } = await supabase
    .from('welcome')
    .select('welcomems')
    .eq('roomId', roomId)
    .order('id', { ascending: false })
    .limit(1)
    .single();
  if (error || !data) {
    console.error('ウェルカムメッセージ取得エラー:', error);
    return;
  }
  const wlMessage = data.welcomems.replace(/<br>/g, '\n');
  if (wlMessage) {
    await sendchatwork(`[rp aid=${welcomeId}][pname:${welcomeId}]さん\n${wlMessage}`, roomId);
  }
}

async function welcomesave(body, message, messageId, roomId, accountId) {
  const n = body.replace(/\n/g, '<br>');
  const pattern = /\{(.*?)\}/;
  const m = n.match(pattern);
  const wlMessage = m && m[1];
  if (!wlMessage) {
    return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n構文エラー`, roomId);
  }
  const isAdmin = await checkAgijidmin(roomId, accountId) || await isUserAdmin(accountId, roomId);
  if (!isAdmin) {
    return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー: この操作は管理者にしか行えません。`, roomId);
  }
  const { data: checkData } = await supabase.from('welcome').select('roomId').eq('roomId', roomId).single();
  if (!checkData) {
    const { error } = await supabase.from('welcome').insert([{ roomId, welcomems: wlMessage }]);
    if (error) {
      return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nようこそメッセージを保存できませんでした`, roomId);
    }
    return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nようこそメッセージを保存しました！`, roomId);
  } else {
    const { error } = await supabase.from('welcome').update({ welcomems: wlMessage }).eq('roomId', roomId);
    if (error) {
      return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nようこそメッセージを編集できませんでした`, roomId);
    }
    return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nようこそメッセージを編集しました！`, roomId);
  }
}

async function welcomedelete(body, message, messageId, roomId, accountId) {
  const isAdmin = await checkAgijidmin(roomId, accountId) || await isUserAdmin(accountId, roomId);
  if (!isAdmin) {
    return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー: この操作は管理者にしか行えません。`, roomId);
  }
  const { error } = await supabase.from('welcome').delete().eq('roomId', roomId);
  if (error) {
    return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n削除しようとしているデータが見つかりません。`, roomId);
  } else {
    return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n削除しました`, roomId);
  }
}

module.exports = {
  welcome,
  welcomesave,
  welcomedelete
};
