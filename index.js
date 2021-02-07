// *****************************************
// アプリケーション初期化
// *****************************************

// ExpressJS初期化
const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

// 環境設定
require('dotenv').config();

// アプリケーション設定
const port = process.env.NODE_PORT || 3000;
app.set('view engine', 'ejs');

// MySQL接続初期化
const mysql = require('mysql2/promise');
const db_setting = {
  host: 'mysql_5.6.50',
  user: 'root',
  password: process.env.ROOT_PASSWORD
};

// データベースとテーブルの作成
(async () => {
  const db = await mysql.createConnection(db_setting);
  await db.execute("CREATE DATABASE IF NOT EXISTS database1");
  try {
    await db.execute("SELECT 1 FROM database1.table1 LIMIT 1");
  }
  catch (error) {
    if (error.code == 'ER_NO_SUCH_TABLE')
      await db.execute("CREATE TABLE database1.table1(id INTEGER AUTO_INCREMENT PRIMARY KEY, value VARCHAR(10))");
    else
      throw error;
  }
  await db.execute("INSERT INTO database1.table1(value) VALUES('hogehoge')");
  db.end();
})(db_setting).catch();

// *****************************************
// ルーティング
// *****************************************

// ルート
app.get('/', (req, res, next) => {
  (async (req, res, next) => {
    const db = await mysql.createConnection(db_setting);
    const [results, fields] = await db.execute('SELECT * FROM database1.table1');
    let text = '';
    for (const result of results) {
      text += result.id + ' -> ' + result.value + "\n";
    }
    res.set('Content-Type', 'text/plain');
    res.send(text);
  })(req, res, next).catch(next);
});

// *****************************************
// サーバー開始
// *****************************************
app.listen(port, () => {
  console.log('Server started');
});
