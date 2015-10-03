'use strict';

const Promise = require('bluebird');
const utils = require('../utils');
const models = require('../models');

exports.getRegister = function(req, res, next) {
    res.render('user_register', { session: req.session, });
}

function parseUserForm(req) {
    return {
        username: req.body.username,
        password: req.body.password,
        name: req.body.name,
        studentID: req.body.studentid,
        year: parseInt(req.body.year, 10) || 0
    };
}

exports.postRegister = function(req, res, next) {
    if (req.session.isLogin) {
        return next(new Error('You have already logged in'));
    }

    let u = parseUserForm(req);

    utils.genPassword(u.password)
    .then(hashedPwd => {
        u.password = hashedPwd;
        return models.User.create(u);
    })
    .then(user => {
        utils.setUserSession(req.session, user);
        res.redirect('/');
    })
    .catch(err => next(err));
}

exports.postLogin = function(req, res, next) {
    if (req.session.isLogin) {
        return next(new Error('You have already logged in'));
    }

    let pUser = models.User.findOne({ where: { username: req.body.username } });
    let pCheckPwd = pUser.then(user => utils.checkPassword(req.body.password, user.password));
    Promise.join(pUser, pCheckPwd, (user, isPwdCorrect) => {
        if (isPwdCorrect) {
            utils.setUserSession(req.session, user);
            return res.redirect('/');
        }
        throw new Error('Incorrect username/password');
    })
    .catch(err => next(err));
}

exports.getLogout = function(req, res, next) {
    if (!req.session.isLogin) {
        return next(new Error('You have not logged in yet'));
    }
    utils.clearUserSession(req.session);
    res.redirect('/');
}

exports.getModify = function(req, res, next) {
    if (!req.session.isLogin) {
        return next(new Error('You have not logged in yet'));
    }

    res.render('user_modify', { session: req.session });
}

exports.postModify = function(req, res, next) {
    if (!req.session.isLogin) {
        return next(new Error('You have not logged in yet'));
    }

    let u = parseUserForm(req);
    let isChangePwd = u.password ? true : false;
    let pUser = models.User.findOne({ where: { username: u.username } })
                .then(user => {
                    if (!user) throw new Error('User not found');
                    return user;
                });
    if (isChangePwd) {
        var pNewPwd = pUser.then(user => utils.checkPassword(req.body.oldpassword, user.password))
                      .then(isPwdCorrect => {
                          if (!isPwdCorrect) throw new Error('Incorrect old password');
                          return utils.genPassword(u.password);
                      });
    } else {
        var pNewPwd = Promise.resolve('');
    }

    Promise.join(pUser, pNewPwd, (user, newPwd) => {
        if (isChangePwd) {
            u.password = newPwd;
        } else {
            u.password = user.password;
        }
        u.username = user.username;
        return user.update(u);
    })
    .then(user => {
        utils.setUserSession(req.session, user);
        res.redirect('/');
    })
    .catch(err => next(err));
}
