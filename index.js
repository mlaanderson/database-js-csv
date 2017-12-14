const fs = require('fs');
const CSV = require('./lib/csv');
const JlSqlApi = require('jl-sql-api');
const parse = require('node-sqlparser').parse;

const api = new JlSqlApi ();

var m_filename = Symbol('filename');
var m_data = Symbol('data');
var m_options = Symbol('options');

class CsvFile {
    constructor(filename, options) {
        options = Object.assign({
            headers: false,
            convertNumbers: false,
            overwriteOnExecute: false
        }, options);

        this[m_filename] = filename;
        this[m_data] = CSV.parse(fs.readFileSync(this[m_filename], 'utf-8'), options);
        this[m_options] = options;
    }

    query(sql) {
        return new Promise((resolve, reject) => {
            api.query(sql).fromArrayOfObjects(this[m_data]).toArrayOfObjects((rows) => {
                resolve(rows);
            });
        })
    }

    execute(sql) {
        return new Promise((resolve, reject) => {
            api.query(sql).fromArrayOfObjects(this[m_data]).toArrayOfObjects((rows) => { 
                this[m_data] = rows;
                if (this[m_options].overwriteOnExecute) {
                    fs.writeFile(this[m_filename], CSV.stringify(this[m_data], {
                        headerRow: this[m_options].headers !== false
                    }), (err) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        });
    }
}

module.exports = {
    open: function(connection) {
        let options = {};
        if (connection.Parameters) {
            connection.Parameters.split('&').map(s => {
                let [key, val] = s.split('=');
                if (val.toLowerCase() === 'true') val = true;
                if (val.toLowerCase() === 'false') val = false;
                if (CSV.NUMBER_REGEX.test(val)) val = parseFloat(val);
                options[key] = val;
            });
        }

        return new CsvFile(connection.Database, options);
    }
}
