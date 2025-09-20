const axios = require('axios');
const { sendchatwork, getChatworkMembers, deleteChatworkMessage } = require('../utils/chatwork');
const { isUserAdmin, isUsermember, checkAgijidmin, supabase } = require('../utils/supabase');

const CHATWORK_API_TOKEN = process.env.CHATWORK_API_TOKEN;

async function blockMembers(accountIdToBlock, roomId) {
  try {
    const isAdmin = await isUserAdmin(accountIdToBlock, roomId);
    if (isAdmin) return;
    
    const members = await getChatworkMembers(roomId);
    if (!members) return;

    const memberRoles = members.reduce((acc, member) => {
        if (member.role === 'admin') acc.adminIds.push(member.account_id);
        else if (member.role === 'member') acc.memberIds.push(member.account_id);
        else if (member.role === 'readonly') acc.readonlyIds.push(member.account_id);
        return acc;
    }, { adminIds: [], memberIds: [], readonlyIds: [] });

    if (!memberRoles.readonlyIds.includes(accountIdToBlock)) {
      memberRoles.readonlyIds.push(accountIdToBlock);
    }
    memberRoles.adminIds = memberRoles.adminIds.filter(id => id !== accountIdToBlock);
    memberRoles.memberIds = memberRoles.memberIds.filter(id => id !== accountIdToBlock);

    const encodedParams = new URLSearchParams();
    encodedParams.set('members_admin_ids', memberRoles.adminIds.join(','));
    encodedParams.set('members_member_ids', memberRoles.memberIds.join(','));
    encodedParams.set('members_readonly_ids', memberRoles.readonlyIds.join(','));

    await axios.put(`https://api.chatwork.com/v2/rooms/${roomId}/members`, encodedParams.toString(), {
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-chatworktoken': CHATWORK_API_TOKEN,
      },
    });
    await sendchatwork(`[info][title]不正利用記録[/title][piconname:${accountIdToBlock}]さんに対して、不正利用フィルターが発動しました。[/info]`, roomId);

  } catch (error) {
    console.error('不正利用フィルターエラー:', error.response ? error.response.data : error.message);
  }
}

async function kickMember(body, accountIdToBlock, messageId, roomId, accountId) {
  try {
    const isAdmin = await checkAgijidmin(roomId, accountId) || await isUserAdmin(accountId, roomId);
    if (!isAdmin) {
      return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー: この操作は管理者にしか行えません。`, roomId);
    }
    if (!accountIdToBlock) return;
    const isKickable = await isUsermember(accountIdToBlock, roomId);
    if (!isKickable) {
      return sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー: 管理者、または既に閲覧のみのユーザーはキックできません。`, roomId);
    }
    const members = await getChatworkMembers(roomId);
    if (!members) return;

    const memberRoles = members.reduce((acc, member) => {
        if (member.role === 'admin') acc.adminIds.push(member.account_id);
        else if (member.role === 'member') acc.memberIds.push(member.account_id);
        else if (member.role === 'readonly') acc.readonlyIds.push(member.account_id);
        return acc;
    }, { adminIds: [], memberIds: [], readonlyIds: [] });

    if (!memberRoles.readonlyIds.includes(accountIdToBlock)) {
      memberRoles.readonlyIds.push(accountIdToBlock);
    }
    memberRoles.adminIds = memberRoles.adminIds.filter(id => id !== accountIdToBlock);
    memberRoles.memberIds = memberRoles.memberIds.filter(id => id !== accountIdToBlock);

    const encodedParams = new URLSearchParams();
    encodedParams.set('members_admin_ids', memberRoles.adminIds.join(','));
    encodedParams.set('members_member_ids', memberRoles.memberIds.join(','));
    encodedParams.set('members_readonly_ids', memberRoles.readonlyIds.join(','));

    await axios.put(`https://api.chatwork.com/v2/rooms/${roomId}/members`, encodedParams.toString(), {
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-chatworktoken': CHATWORK_API_TOKEN,
      },
    });
    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n[piconname:${accountIdToBlock}]さんをキックしました。`, roomId);
  } catch (error) {
    console.error('キックエラー:', error.response ? error.response.data : error.message);
    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラーが発生しました。詳細: ${error.message}`, roomId);
  }
}

// 複数メッセージの削除
async function kickMembers(body, messageId, roomId, accountId) {
  const dlmessageIds = [...body.matchAll(/(?<=to=\d+-)(\d+)/g)].map(match => match[0]);
  if (dlmessageIds.length === 0) return;
  for (const msgId of dlmessageIds) {
    try {
      await deleteChatworkMessage(roomId, msgId);
    } catch (err) {
      console.error(`メッセージID ${msgId} の削除中にエラー:`, err.response ? err.response.data : err.message);
    }
  }
}

// 権限再付与
async function retrust(body, message, messageId, roomId, accountId) {
  try {
    const isAdmin = await checkAgijidmin(roomId, accountId) || await isUserAdmin(accountId, roomId);

    if (!isAdmin) {
      await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー: この操作は管理者にしか行えません。`, roomId);
      return;
    }

    const accountIdToBlock = message;
    if (!accountIdToBlock) {
      return;
    }

    const isKickable = await isUsermember(accountIdToBlock, roomId);

    if (!isKickable) {
      await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー: 管理者、または既に閲覧のみのユーザーはキックできません。`, roomId);
      return;
    }

    const members = await getChatworkMembers(roomId);

    let adminIds = [];
    let memberIds = [];
    let readonlyIds = [];

    members.forEach(member => {
      if (member.role === 'admin') {
        adminIds.push(member.account_id);
      } else if (member.role === 'member') {
        memberIds.push(member.account_id);
      } else if (member.role === 'readonly') {
        readonlyIds.push(member.account_id);
      }
    });
    if (!readonlyIds.includes(accountIdToBlock)) {
      readonlyIds.push(accountIdToBlock);
    }

    adminIds = adminIds.filter(id => id !== accountIdToBlock);
    memberIds = memberIds.filter(id => id !== accountIdToBlock);

    const encodedParams = new URLSearchParams();
    encodedParams.set('members_admin_ids', adminIds.join(','));
    encodedParams.set('members_member_ids', memberIds.join(','));
    encodedParams.set('members_readonly_ids', readonlyIds.join(','));

    const url = `https://api.chatwork.com/v2/rooms/${roomId}/members`;
    await axios.put(url, encodedParams.toString(), {
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-chatworktoken': CHATWORK_API_TOKEN,
      },
    });

    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n[piconname:${accountIdToBlock}]さんをキックしました。`, roomId);

  } catch (error) {
    console.error('エラー:', error.response ? error.response.data : error.message);
    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラーが発生しました。詳細: ${error.message}`, roomId);
  }
}

// 任意の荒らし対策
async function arasitaisaku(body, message, messageId, roomId, accountId) {
  try {
    const isAdmin = await checkAgijidmin(roomId, accountId) || await isUserAdmin(accountId, roomId);
    if (!isAdmin) {
      await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー: この操作は管理者にしか行えません。`, roomId);
      return;
    }
    const { data, error } = await supabase.from('arashi_rooms').select('roomId').eq('roomId', roomId);
    if (error) {
      await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー。`, roomId);
      return;
    }
    if (data.length === 0) {           
      const { error: insertError } = await supabase.from('arashi_rooms').insert([{ roomId: roomId }]);
      if (insertError) {
        await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー。設定の変更を保存できませんでした`, roomId);
        return;
      }
      await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nゆずbotによる不正利用フィルターをONにしました。`, roomId);
    } else {
      const { error: deleteError } = await supabase.from('arashi_rooms').delete().eq('roomId', roomId);
      if (deleteError) {
        await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー。設定の変更を保存できませんでした`, roomId);
        return;
      }
      await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nゆずbotによる不正利用フィルターをOFFにしました。`, roomId);
    }
  } catch (err) {
    console.error('エラー:', err);
  }
}

module.exports = {
  blockMembers,
  kickMember,
  kickMembers,
  retrust,
  arasitaisaku
};
