const NumberRegex = /[-+]?(:?\d*\.)?\d+(?:[eE][-+]?\d+)?/;
/**
 * Turns a single line of CSV text into an array of string values
 * @param {string} row 
 */
function StringToCsvRow(row) { 
    var chunks = row.split(/\"/g);
    var pos = 0;
    var indexes = [];

    if (chunks.length %2 === 0) {
        throw new Error("Unbalanced Quotes");
    }

    chunks.map((chunk, n) => {
        if (n % 2 === 1) {
            // quoted section
            pos += chunk.length + 2;
            return;
        }

        let subPos = -1;
        while ((subPos = chunk.indexOf(',', subPos + 1)) >= 0) {
            indexes.push(pos + subPos);
        }

        pos += chunk.length;
    });

    var result = indexes.map((i, n) => {
        var last = n > 0 ? indexes[n-1] + 1 : 0;
        return row.substr(last, i - last);
    });
    result.push(row.substr(indexes[indexes.length - 1] + 1));

    return result;
}

/**
 * Gets an Excel style header
 * @param {number} n 
 */
function xlHeader(n) {
    var result = String.fromCharCode(0x41 + (n % 26));
    if (n >= 26) {
        result = xlHeader(n / 26 - 1) + result;
    }
    return result;
}

/**
 * 
 * @param {string} csv 
 * @param {{ headers: boolean | Array<string>, convertNumbers: boolean}} options 
 */
function parse(csv, options) {
    options = Object.assign({}, {
        headers: false,
        convertNumbers: false
    }, options);

    var rows = csv.toString().split(/[\r\n]/g).filter(l => l.length > 0);
    var headers;

    if (options.headers === true) { 
        options.headers = StringToCsvRow(rows.shift());
    }

    if (Array.prototype.isPrototypeOf(options.headers)) {
        headers = function(n) {
            if (n < options.headers.length) {
                return options.headers[n];
            }
            return false;
        }
    } else {
        headers = xlHeader;
    }
    
    return rows.map(row => {
        row = StringToCsvRow(row);
        var result = {};
        row.map((cell, n) => {
            var header = headers(n);
            if (header) {
                if (options.convertNumbers && NumberRegex.test(cell)) {
                    cell = parseFloat(cell);
                }
                result[header] = cell;
            }
        });
        return result;
    });
}

/**
 * Turns an array of Javascript objects into CSV text
 * @param {*} obj 
 * @param {{headerRow: boolean}} options 
 */
function stringify(obj, options) {
    if ((Array.prototype.isPrototypeOf(obj) === false) || (obj.length <= 0)) {
        return "";
    }
    options = Object.assign({}, {
        headerRow: false
    }, options);

    var rows;
    var headers = [];

    if (options.headerRow) {
        headers = Object.keys(obj[0]);
    } else {
        headers = Object.keys(obj[0]).map((h,n) => xlHeader(n));
    }

    rows = obj.map(row => {
        var cells = headers.map(h => row[h] || ""); 
        return cells.map(c => {
            var cell = c.toString();
            if ((cell.indexOf(',') >= 0) || (cell.indexOf('"') > 0)) {
                return '"' + cell.replace('"', '""') + '"';
            }
            return cell;
        }).join(',');
    });

    if (options.headerRow) {
        rows.unshift(headers);
    }

    return rows.join('\r\n');
}

module.exports = {
    parse: parse,
    stringify: stringify,
    NUMBER_REGEX: NumberRegex
}

