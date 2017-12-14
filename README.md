# database-js-csv
Database-js driver for CSV files

## About
Database-js-csv is a wrapper around the [jl-sql-api](https://github.com/avz/node-jl-sql-api) package by avz. It is intended to be used with the [database-js](https://github.com/mlaanderson/database-js) package. 

## Usage
~~~~
var Connection = require('database-js2').Connection;

(async () => {
    let connection, statement, rows;
    connection = new Database('csv:///test.csv?headers=true&overwriteOnExecute=true');
    
    try {
        statement = await connection.prepareStatement("SELECT * WHERE user_name = ?");
        rows = await statement.query('not_so_secret_user');
        console.log(rows);
    } catch (error) {
        console.log(error);
    } finally {
        await connection.close();
    }
})();
~~~~