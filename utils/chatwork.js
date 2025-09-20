const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const CHATWORK_API_TOKEN = process.env.CHATWORK_API_TOKEN;

/**
 * Chatworkにメッセージを送信する
 * @param {string} ms - 送信するメッセージ
 * @param {string} CHATWORK_ROOM_ID - 送信先のルームID
 */
async function sendchatwork(ms, CHATWORK_ROOM_ID) {
  try {
    await axios.post(
      `https://api.chatwork.com/v2/rooms/${CHATWORK_ROOM_ID}/messages`,
      new URLSearchParams({ body: ms }),
      {
        headers: {
          "X-ChatWorkToken": CHATWORK_API_TOKEN,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    console.log("メッセージ送信成功");
  } catch (error) {
    console.error("Chatworkへのメッセージ送信エラー:", error.response?.data || error.message);
  }
}

/**
 * ルームのメンバーリストを取得する
 * @param {string} roomId - ルームID
 * @returns {Array|null} - メンバーの配列
 */
async function getChatworkMembers(roomId) {
  try {
    const response = await axios.get(
      `https://api.chatwork.com/v2/rooms/${roomId}/members`,
      {
        headers: {
          "X-ChatWorkToken": CHATWORK_API_TOKEN,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Chatworkメンバー取得エラー:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Chatworkにファイルを送信する
 * @param {string} roomId - ルームID
 * @param {string} filePath - 送信するファイルのパス
 */
async function sendFileToChatwork(roomId, filePath) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const uploadUrl = `https://api.chatwork.com/v2/rooms/${roomId}/files`;
    const headers = { ...formData.getHeaders(), 'x-chatworktoken': CHATWORK_API_TOKEN };

    await axios.post(uploadUrl, formData, { headers });
  } catch (error) {
    console.error('ファイル送信エラー:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * メッセージを削除する
 * @param {string} roomId - ルームID
 * @param {string} messageId - メッセージID
 */
async function deleteChatworkMessage(roomId, messageId) {
  try {
    await axios.delete(`https://api.chatwork.com/v2/rooms/${roomId}/messages/${messageId}`, {
      headers: { 'Accept': 'application/json', 'x-chatworktoken': CHATWORK_API_TOKEN }
    });
  } catch (err) {
    console.error(`メッセージID ${messageId} の削除中にエラー:`, err.response ? err.response.data : err.message);
    throw err;
  }
}

module.exports = {
  sendchatwork,
  getChatworkMembers,
  sendFileToChatwork,
  deleteChatworkMessage
};
