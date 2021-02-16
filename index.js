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
app.locals.db_setting = db_setting;

let retry_count = 5;

// データベースとテーブルの作成
const attemptConnection = async () => {
  let conn;
  try {
    conn = await mysql.createConnection(db_setting);
    console.log('DB connection started.');
  } catch (err) {
    if (retry_count > 0) {
      setTimeout(attemptConnection, 5000);
      console.log('DB connection retrying...');
      retry_count--;
      return;
    }
    else
      throw err;
  }

  try {
    await conn.query('CREATE DATABASE IF NOT EXISTS database1');
    await conn.query('CREATE TABLE IF NOT EXISTS database1.table1(id INTEGER AUTO_INCREMENT PRIMARY KEY, value VARCHAR(10))');
    await conn.query("INSERT INTO database1.table1(value) VALUES('hogehoge')");
  } catch (err) {
    throw err;
  } finally {
    conn.end();
  }
  console.log('DB initializing completed.');

  // *****************************************
  // ルーティング
  // *****************************************

  // ルート
  app.get('/', (req, res, next) => {
    const db_setting = req.app.locals.db_setting;

    (async () => {
      const conn = await mysql.createConnection(db_setting);
      try {
        const [results, fileds] = await conn.query('SELECT * FROM database1.table1');
        let text = '';
        for (const result of results) {
          text += result.id + ' -> ' + result.value + "\n";
        }
        res.set('Content-Type', 'text/plain');
        res.send(text);
        next();
      } catch (err) {
        throw err;
      } finally {
        conn.end();
      }
    })();
  });

  // *****************************************
  // サーバー開始
  // *****************************************
  app.listen(port, () => {
    console.log('Server started');
  });
}
attemptConnection();

