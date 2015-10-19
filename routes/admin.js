'use strict';

const Promise = require('bluebird');
const utils = require('../utils');
const models = require('../models');

exports.getResetPassword = function(req, res, next) {
    if (!req.session.isAdmin) {
        return next(new Error('Permission Denied'));
    }

    res.render('admin_reset_password', { session: req.session });
}

exports.postResetPassword = function(req, res, next) {
    if (!req.session.isAdmin) {
        return next(new Error('Permission Denied'));
    }

    let stuid = req.body.studentID;
    let pUser = models.User.findOne({ where: { studentID: stuid}});
    let pPwd = pUser.then(user => {
        if (!user) throw new Error('Student Not Found');
        return utils.randomPassword();
    });
    let pUpdate = Promise.join(pUser, pPwd, (user, pwd) => {
        user.password = pwd.hash;
        return user.save();
    })
    Promise.join(pUser, pPwd, pUpdate, (_, pwd, user) => {
        res.render('admin_reset_password_result', {
            session: req.session,
            user: user,
            plain: pwd.plain,
        });
    })
    .catch(next);
}

exports.getBulkRegister = function(req, res, next) {
    if (!req.session.isAdmin) {
        return next(new Error('Permission Denied'));
    }

    res.render('admin_bulk_register', { session: req.session, });
}

exports.postBulkRegister = function(req, res, next) {
    if (!req.session.isAdmin) {
        return next(new Error('Permission Denied'));
    }

    let data = req.body.data;
    let lines = data.match(/^.*((\r\n|\n|\r)|$)/gm);
    let users = [];
    lines.forEach(line => {
        let splited = line.split('\t');
        if (splited.length !== 3) return;
        users.push({
            studentID: splited[0].trim(),
            name: splited[1].trim(),
            year: parseInt(splited[2].trim(), 10)
        });
    });

    if (!lines) return next(new Error('No valid user'));

    let pGenPwd = utils.bulkRandomPassword(users.length);
    let pCreate = pGenPwd.then(pwds => {
        for (var i = 0; i < users.length; ++i)
            users[i].password = pwds[i].hash;
        return models.User.bulkCreate(users, {validate: true});
    });
    Promise.join(pGenPwd, pCreate, (pwds, docs) => {
        for (var i = 0; i < users.length; ++i)
            users[i].password = pwds[i].plain;
        res.render('admin_bulk_register_result', { 
            session: req.session, 
            users: users
        });
    })
    .catch(next);
}
