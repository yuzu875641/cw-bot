const { sendchatwork } = require('../utils/chatwork');
const { supabase } = require('../utils/supabase');
const { DateTime } = require('luxon');

async function komikuji(body, message, messageId, roomId, accountId) {
  const results = [
      { fortune: "ゆず！" }, { fortune: "極大吉" }, { fortune: "超大吉" }, { fortune: "大吉" },
      { fortune: "中吉" }, { fortune: "小吉" }, { fortune: "末吉" }, { fortune: "凶" },
      { fortune: "大凶" }, { fortune: "---深刻なエラーが発生しました---" }
  ];
  const probabilities = [
      { fortuneIndex: 0, probability: 0.003 }, { fortuneIndex: 1, probability: 0.10 },
      { fortuneIndex: 2, probability: 0.10 }, { fortuneIndex: 3, probability: 0.40 },
      { fortuneIndex: 4, probability: 0.10 }, { fortuneIndex: 5, probability: 0.08 },
      { fortuneIndex: 6, probability: 0.07 }, { fortuneIndex: 7, probability: 0.07 },
      { fortuneIndex: 8, probability: 0.07 }, { fortuneIndex: 9, probability: 0.007 }
  ];
  const today = DateTime.now().setZone('Asia/Tokyo').toFormat('yyyy-MM-dd');

  const { data, error } = await supabase.from('omikuji_log').select('*').eq('accountId', accountId).eq('roomId', roomId).eq('date', today).single();
  if (data) {
    return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n今日はもうおみくじを引いています！明日また挑戦してね！`, roomId);
  }
  const rand = Math.random();
  let cumulativeProbability = 0;
  let resultIndex = 0;
  for (const prob of probabilities) {
      cumulativeProbability += prob.probability;
      if (rand < cumulativeProbability) {
          resultIndex = prob.fortuneIndex;
          break;
      }
  }
  const result = results[resultIndex];
  await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n${result.fortune}`, roomId);
  await supabase.from('omikuji_log').insert([{ accountId: accountId, date: today, roomId: roomId }]);
}

module.exports = {
  komikuji
};
