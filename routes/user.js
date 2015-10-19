'use strict';

const Promise = require('bluebird');
const utils = require('../utils');
const models = require('../models');
const config = require('../config');

exports.getRegister = function(req, res, next) {
    res.render('user_register', { session: req.session, });
}

exports.postRegister = function(req, res, next) {
    if (req.session.isLogin) {
        return next(new Error('You have already logged in'));
    }

    let u = models.User.parse(req.body);

    utils.genPassword(u.password)
    .then(hashedPwd => {
        u.password = hashedPwd;
        return models.User.create(u);
    })
    .then(user => {
        utils.setUserSession(req.session, user);
        res.redirect(`${config.root}`);
    })
    .catch(err => next(err));
}

exports.postLogin = function(req, res, next) {
    if (req.session.isLogin) {
        return next(new Error('You have already logged in'));
    }

    let pUser = models.User.getByStudentID(req.body.studentID);
    let pCheckPwd = pUser.then(user => utils.checkPassword(req.body.password, user.password));
    Promise.join(pUser, pCheckPwd, (user, isPwdCorrect) => {
        if (isPwdCorrect) {
            utils.setUserSession(req.session, user);
            return res.redirect(`${config.root}`);
        }
        throw new Error('Incorrect studentID/password');
    })
    .catch(err => next(err));
}

exports.getLogout = function(req, res, next) {
    if (!req.session.isLogin) {
        return next(new Error('You have not logged in yet'));
    }
    utils.clearUserSession(req.session);
    res.redirect(`${config.root}`);
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

    let u = models.User.parse(req.body);
    let isChangePwd = u.password ? true : false;
    let pUser = models.User.getByStudentID(req.session.user.studentID);
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
        u.id = user.id;
        u.studentID = user.studentID;
        return user.update(u);
    })
    .then(user => {
        utils.setUserSession(req.session, user);
        res.redirect(`${config.root}`);
    })
    .catch(err => next(err));
}
