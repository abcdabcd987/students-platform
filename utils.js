'use strict';

let Promise = require('bluebird');
let crypto = Promise.promisifyAll(require('crypto'));

function hashPassword(algorithm, iterations, keylen, salt, password) {
    return crypto.pbkdf2Async(password, salt, iterations, keylen, algorithm)
           .then(key => key.toString('hex'));
}

exports.genPassword = function (password) {
    const RANDOM_BYTES = 64;
    const ITERATIONS = 1<<14;
    const KEYLEN = 64;
    const ALGORITHM = 'sha256';

    let pSalt = crypto.randomBytesAsync(RANDOM_BYTES).then(bytes => bytes.toString('hex'));
    let pHash = pSalt.then(salt => hashPassword(ALGORITHM, ITERATIONS, KEYLEN, salt, password));
    return Promise.join(pSalt, pHash, (salt, hash) => {
        return `${ALGORITHM}:${ITERATIONS}:${KEYLEN}:${salt}:${hash}`;
    });
}

exports.bulkRandomPassword = function (count) {
    const PWD_BYTES = 4;

    let pPlains = crypto.randomBytesAsync(PWD_BYTES * count).then(bytes => {
        let str = bytes.toString('hex');
        let length = str.length / count;
        let plains = [];
        for (var i = 0; i < count; ++i)
            plains.push(str.substr(length*i, length));
        return plains;
    });
    let pHashes = pPlains.then(plains => {
        return Promise.all(plains.map(exports.genPassword));
    });
    return Promise.join(pPlains, pHashes, (plains, hashes) => {
        let pwds = [];
        for (var i = 0; i < count; ++i)
            pwds.push({ plain: plains[i], hash: hashes[i] });
        return pwds;
    });
}

exports.checkPassword = function (password, correct) {
    let splited = correct.split(':');
    let algorithm = splited[0];
    let iterations = parseInt(splited[1], 10);
    let keylen = parseInt(splited[2], 10);
    let salt = splited[3];
    let hash = splited[4];

    return hashPassword(algorithm, iterations, keylen, salt, password)
           .then(h => hash === h);
}

exports.setUserSession = function(session, user) {
    session.isLogin = true;
    session.user = user;
    session.isAdmin = true; // Fix me
}

exports.clearUserSession = function(session) {
    session.isLogin = false;
    session.user = {};
    session.isAdmin = false; // Fix me
}
