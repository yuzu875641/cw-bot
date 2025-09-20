const axios = require('axios');
const fs = require('fs');
const { sendchatwork, sendFileToChatwork } = require('../utils/chatwork');

async function sendFile(body, message, messageId, roomId, accountId) {
  try {
    const localFilePath = 'tstfile';
    const writer = fs.createWriteStream(localFilePath);
    const response = await axios({
      method: 'get',
      url: "https://cdn.glitch.global/17268288-67ef-4f38-bc54-bd0c299f1e57/IMG_1111_Original.jpeg?v=1732982430878",
      responseType: 'stream',
    });
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    await sendFileToChatwork(roomId, localFilePath);
    fs.unlinkSync(localFilePath);
  } catch (error) {
    console.error('画像送信エラー:', error.response ? error.response.data : error.message);
  }
}

module.exports = {
  sendFile
};
