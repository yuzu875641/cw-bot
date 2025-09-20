"use strict";

// --- ライブラリのインポート ---
const express = require("express");
const app = express();
const cluster = require("cluster");
const os = require("os");
const compression = require("compression");
const bodyParser = require("body-parser");

// --- 共通ヘルパー関数のインポート ---
const { sendchatwork } = require('./utils/chatwork');
const { fetchTrigger } = require('./utils/supabase');

// --- コマンドハンドラのインポート ---
const { wakamehelp } = require('./commands/help');
const { say } = require('./commands/say');
const { komikuji } = require('./commands/omikuji');
const { save, deleteData, Settings } = require('./commands/settings');
const { RandomMember } = require('./commands/member');
const { sendFile } = require('./commands/file');
const { addAdmin, removeAdmin, gijiAdminList } = require('./commands/admin');
const { kickMember, blockMembers, kickMembers, retrust, arasitaisaku } = require('./commands/kick');
const { welcomesave, welcomedelete, welcome } = require('./commands/welcome');

// --- クラスタリングとサーバー設定 ---
const numClusters = os.cpus().length;
const PORT = 3000;
if (cluster.isMaster) {
  for (let i = 0; i < numClusters; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, code, signal) => {
    cluster.fork();
  });
} else {
  app.use(compression());
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} started on port ${PORT}`);
  });
}

// --- 環境変数と定数の設定 ---
app.use(bodyParser.json());
const zalgoPattern = /[\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/;

// --- コマンドハンドラの設定 ---
const commands = {
  "help": wakamehelp,
  "say": say,
  "おみくじ": komikuji,
  "save": save,
  "delete": deleteData,
  "setting": Settings,
  "member": RandomMember,
  "画像送ってみて": sendFile,
  "admin": addAdmin,
  "deladmin": removeAdmin,
  "adminlist": gijiAdminList,
  "kick": kickMember,
  "welcome": welcomesave,
  "welcomedelete": welcomedelete,
};

// --- エンドポイントの定義 ---

// サーバーのヘルスチェック用
app.get('/', (req, res) => {
    res.sendStatus(200);
});

// ChatworkのメインWebhookエンドポイント
app.post("/webhook", async (req, res) => {
  const accountId = req.body.webhook_event.from_account_id;
  const roomId = req.body.webhook_event.room_id;
  const messageId = req.body.webhook_event.message_id;
  const body = req.body.webhook_event.body;  
  const message = body.replace(/\[To:\d+\]ゆずbotさん|\/.*?\/|\s+/g, "");
  
  if (body.includes("/削除/")) {
    await kickMembers(body, messageId, roomId, accountId);
    return res.sendStatus(200);
  }
  
  if (body.includes("[rp aid=10617115")) return res.sendStatus(200);
  if (body.includes("[toall]")) return res.sendStatus(200);
  
  const command = getCommand(body);
  if (command && commands[command]) {
    await commands[command](body, message, messageId, roomId, accountId);
  } else if (command) {
    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n存在しないコマンドです`, roomId);
  } else {
    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nこんにちはー。`, roomId);
  }
  
  res.sendStatus(200);
});

// 全てのメッセージを受け取るエンドポイント
app.post("/getchat", async (req, res) => {
  const body = req.body.webhook_event.body;
  const message = req.body.webhook_event.body;
  const accountId = req.body.webhook_event.account_id;
  const roomId = req.body.webhook_event.room_id;
  const messageId = req.body.webhook_event.message_id;
  
  if (accountId === 9884448) return res.sendStatus(200);
  if (body.includes("[To:10617115]")) return res.sendStatus(200);
  
  if (body.includes("/kick/")) {
    await kickMembers(body, message, messageId, roomId, accountId);
    return res.sendStatus(200);
  }
  
  // 荒らし対策のチェック
  if ((body.match(/\)/g) || []).length >= 30 || (body.match(/all/g) || []).length >= 10 || (body.match(/To:/g) || []).length >= 35 || (body.match(zalgoPattern) || []).length >= 18) {
    await blockMembers(accountId, roomId);
  }

  // 貫通おみくじ
  if (message === "おみくじ") {
    await komikuji(body, message, messageId, roomId, accountId);
    return res.sendStatus(200);
  }
  
  // 新規メンバー追加時のウェルカムメッセージ
  if (/^\[info\]\[title\]\[dtext:chatroom_chat_edited\]\[\/title\]\[dtext:chatroom_member_is\]\[piconname:\d+\]\[dtext:chatroom_added\]\[\/info\]$/.test(message)) {
    await welcome(message, roomId);
    return res.sendStatus(200);
  }

  // ユーザー定義のトリガーメッセージ
  const matchedData = await fetchTrigger(roomId, message);
  if (matchedData) {
    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n${matchedData.responseMessage}`, roomId);
    return res.sendStatus(200);
  }

  res.sendStatus(200);
});

// メッセージからコマンドを抽出する
function getCommand(body) {
  const pattern = /\/(.*?)\//;
  const match = body.match(pattern);
  return match ? match[1] : null;
      }
