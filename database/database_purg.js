const mysql = require('mysql2');
const logger = require('../logger');

const pool = mysql.createPool({
    host:'localhost', // IP do servidor MySQL
    user: 'admin',         // Nome de usuário do MySQL
    password: '178027WaPurg', // Senha do MySQL
    database: 'purg',  // Nome do banco de dados
    port: 3306,            // Porta padrão do MySQL
    waitForConnections: true,
    connectionLimit: 50,   // Número máximo de conexões no pool
    queueLimit: 0          // Número máximo de consultas na fila (0 = ilimitado)
});

pool.getConnection((err, connection) => {
    if (err) {
        logger.error('Erro ao conectar ao banco de dados:', { message: err.message, code: err.code });
        return;
    }
    logger.info('Conectado ao banco de dados MySQL.');
    connection.release();
});

// Health check periódico a cada 30 segundos para detectar falhas de conexão cedo
setInterval(() => {
    pool.query('SELECT 1', (err) => {
        if (err) {
            logger.error('Health check do banco de dados falhou:', { message: err.message, code: err.code });
        }
    });
}, 30000);

// ── Debug instrumentation ──────────────────────────────────────────────────
// Intercepta pool.query (callback-style) e pool.promise() (promise-style,
// incluindo conexões de transação) para emitir logs debug em tempo real.
// pool.promise() cria uma nova instância a cada chamada, por isso é o próprio
// método pool.promise que é substituído — garantindo que toda chamada futura
// receba uma instância já instrumentada.

function sqlPreview(sql) {
    return (typeof sql === 'object' ? sql.sql : sql)?.replace(/\s+/g, ' ').trim() ?? '?';
}

function resultPreview(rows) {
    const count = Array.isArray(rows) ? `${rows.length} row(s)` : 'ok';
    return `${count} | ${JSON.stringify(rows).substring(0, 400)}`;
}

function wrapAsyncMethod(target, method, tag) {
    const original = target[method].bind(target);
    target[method] = async function (sql, params) {
        const preview = sqlPreview(sql);
        if (logger.isDebugEnabled()) {
            logger.debug(`[${tag}] ${preview} | params: ${JSON.stringify(params ?? [])}`);
        }
        const result = await original(sql, params);
        if (logger.isDebugEnabled()) {
            logger.debug(`[${tag} RES] ${preview.substring(0, 80)} → ${resultPreview(result[0])}`);
        }
        return result;
    };
}

// 1. Callback-style: pool.query(sql, [params], callback)
const _origQuery = pool.query.bind(pool);
pool.query = function (sql, values, callback) {
    const isHealthCheck = typeof sql === 'string' && sql.trim() === 'SELECT 1';
    const cb   = typeof values === 'function' ? values : callback;
    const vals = typeof values === 'function' ? undefined : values;
    const preview = sqlPreview(sql);

    if (logger.isDebugEnabled() && !isHealthCheck) {
        logger.debug(`[SQL] ${preview} | params: ${JSON.stringify(vals ?? [])}`);
    }

    const wrappedCb = function (err, results, fields) {
        if (logger.isDebugEnabled() && !isHealthCheck && !err) {
            logger.debug(`[SQL RES] ${preview.substring(0, 80)} → ${resultPreview(results)}`);
        }
        if (cb) cb(err, results, fields);
    };

    // Preserva a assinatura original: não passa vals se for undefined
    return vals !== undefined
        ? _origQuery(sql, vals, wrappedCb)
        : _origQuery(sql, wrappedCb);
};

// 2. Promise-style: substitui pool.promise para que CADA chamada receba
//    uma PromisePool instrumentada (pool.promise() cria nova instância a cada vez)
const _origPromise = pool.promise.bind(pool);
pool.promise = function () {
    const pp = _origPromise();
    wrapAsyncMethod(pp, 'query',   'SQL');
    wrapAsyncMethod(pp, 'execute', 'SQL');

    // Transações: instrumenta a conexão devolvida por getConnection
    const _origGetConn = pp.getConnection.bind(pp);
    pp.getConnection = async function () {
        const conn = await _origGetConn();
        wrapAsyncMethod(conn, 'execute', 'SQL TX');
        wrapAsyncMethod(conn, 'query',   'SQL TX');
        return conn;
    };

    return pp;
};

module.exports = pool;

