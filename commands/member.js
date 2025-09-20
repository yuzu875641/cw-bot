const { sendchatwork, getChatworkMembers } = require('../utils/chatwork');

async function RandomMember(body, triggerMessage, messageId, roomId, accountId) {
  try {
    const members = await getChatworkMembers(roomId);
    if (!members || members.length === 0) return;
    const randomIndex = Math.floor(Math.random() * members.length);
    const randomMember = members[randomIndex];
    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n[piconname:${randomMember.account_id}]さんが選ばれました！`, roomId);
  } catch (error) {
    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー。あらら`, roomId);
  }
}

module.exports = {
  RandomMember
};
