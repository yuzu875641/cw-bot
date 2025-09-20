const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * ユーザーがChatworkの管理者かチェックする
 * @param {string} accountId - ユーザーのAccountId
 * @param {string} roomId - ルームID
 * @returns {boolean}
 */
async function isUserAdmin(accountId, roomId) {
  try {
    const response = await axios.get(`https://api.chatwork.com/v2/rooms/${roomId}/members`, {
      headers: { 'X-ChatWorkToken': CHATWORK_API_TOKEN }
    });
    const member = response.data.find(m => m.account_id === accountId);
    return member && member.role === 'admin';
  } catch (error) {
    console.error('Chatwork管理者チェックエラー:', error);
    return false;
  }
}

/**
 * ユーザーがメンバーロールかチェックする
 * @param {string} accountId - ユーザーのAccountId
 * @param {string} roomId - ルームID
 * @returns {boolean}
 */
async function isUsermember(accountId, roomId) {
  try {
    const response = await axios.get(`https://api.chatwork.com/v2/rooms/${roomId}/members`, {
      headers: { 'X-ChatWorkToken': CHATWORK_API_TOKEN }
    });
    const member = response.data.find(m => m.account_id.toString() === accountId.toString());
    return member && member.role === 'member';
  } catch (error) {
    console.error('Chatworkメンバーチェックエラー:', error);
    return false;
  }
}


/**
 * 擬似管理者かをチェックする
 * @param {string} roomId - ルームID
 * @param {string} accountId - ユーザーのAccountId
 * @returns {boolean}
 */
async function checkAgijidmin(roomId, accountId) {
  try {
    const { data, error } = await supabase
      .from('room_admins') 
      .select('accountId')
      .eq('roomId', roomId)
      .eq('accountId', accountId)
      .single();
    return !error || (error && data);
  } catch (error) {
    console.error("擬似管理者チェックエラー:", error.message);
    return false;
  }
}

/**
 * ユーザー定義のトリガーメッセージを取得する
 * @param {string} roomId - ルームID
 * @param {string} message - メッセージ本文
 * @returns {object|null} - マッチしたデータ
 */
async function fetchTrigger(roomId, message) {
  const { data, error } = await supabase
    .from('text')
    .select('triggerMessage, responseMessage')
    .eq('roomId', roomId);
  if (error) {
    console.error('Supabaseエラー:', error);
    return null;
  }
  return data.find(item => message === item.triggerMessage);
}

module.exports = {
  supabase,
  isUserAdmin,
  isUsermember,
  checkAgijidmin,
  fetchTrigger
};
