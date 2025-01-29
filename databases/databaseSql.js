import mysql from "mysql";

const config={
    host:'localhost',
    user:'root',
    password:'',
    database:'tdrecord'
}

const db=mysql.createPool(config);


export default db;