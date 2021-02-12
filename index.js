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
const mysql = require('mysql2');
const db_setting = {
  host: 'mysql_5.6.50',
  user: 'root',
  password: process.env.ROOT_PASSWORD,
  connectTimeout: 5000,
  waitForConnections: true
};

const db = mysql.createPool(db_setting);
let retry_count = 5;

// データベースとテーブルの作成
const attemptConnection = () => {
  db.getConnection((err, conn) => {
    if (err) {
      if (retry_count > 0) {
        setTimeout(attemptConnection, db_setting.connectTimeout);
        console.log('error connecting. retrying in ' + (db_setting.connectTimeout / 1000) + ' sec');
        retry_count--;
      }
      else
        throw err;
    }
    else {
      conn.query("CREATE DATABASE IF NOT EXISTS database1", (err, results, fields) => {
        if (err)
          throw err;
        else {
          conn.query("SELECT 1 FROM database1.table1 LIMIT 1", (err, results, fields) => {
            if (err)
              if (err.code == 'ER_NO_SUCH_TABLE') {
                conn.query("CREATE TABLE database1.table1(id INTEGER AUTO_INCREMENT PRIMARY KEY, value VARCHAR(10))", (err, results, fields) => {
                  if (err)
                    throw err;
                  conn.query("INSERT INTO database1.table1(value) VALUES('hogehoge')");
                  db.releaseConnection(conn);
                });
              }
              else
                throw err;
          });
        }
      });
    }
  });
}
attemptConnection();

app.locals.db = db;


// *****************************************
// ルーティング
// *****************************************

// ルート
app.get('/', (req, res, next) => {

  const db = req.app.locals.db;
  db.getConnection((err, conn) => {
    if (err)
      throw err;
    conn.query('SELECT * FROM database1.table1', (err, results, fields) => {
      let text = '';
      for (const result of results) {
        text += result.id + ' -> ' + result.value + "\n";
      }
      res.set('Content-Type', 'text/plain');
      res.send(text);
      next();
    });
  });
});

// *****************************************
// サーバー開始
// *****************************************
app.listen(port, () => {
  console.log('Server started');
});
