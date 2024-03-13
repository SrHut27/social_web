const mysql = require('mysql2');

const connection  = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'news_mp'

});

module.exports = connection;