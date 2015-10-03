'use strict';

const utils = require('../utils');
const models = require('../models');

exports.getNewSpeech = function(req, res, next) {
    if (!req.session.isAdmin) {
        return next(new Error('Permission Denied'));
    }

    res.render('speech_new', { session: req.session, });
}

function parseSpeechForm(req) {
    return {
        title: req.body.title,
        urlname: req.body.urlname,
        speaker: parseInt(req.body.speaker, 10) || 0,
        description: req.body.description,
        date: req.body.date,
    };
}

exports.postNewSpeech = function(req, res, next) {
    if (!req.session.isAdmin) {
        return next(new Error('Permission Denied'));
    }

    let s = parseSpeechForm(req);
    models.Speech.create(s)
    .then(speech => {
        res.redirect(`/speech/${speech.urlname}`);
    })
    .catch(err => next(err));
}

exports.getModifySpeech = function(req, res, next) {

}

exports.postModifySpeech = function(req, res, next) {

}

exports.ajaxNewResource = function(req, res, next) {
    let urlname = req.params.urlname;
    let pSpeech = models.Speech.findOne({ where: { urlname: urlname } });
    let pResources = pSpeech.then(speech => speech.getResources);
    Promise.all([pSpeech, pResources]).then(args => {
        let speech = args[0];
        let resources = args[1];
        let isSpeaker = false;
        resources.forEach(res =>
            isSpeaker |= res.key === 'speaker' && res.value == req.session.user.username);
        if (!isSpeaker && !req.session.isAdmin) {
            return next(new Error('Permission Denied'));
        }

        let r = {
            type: req.body.type,
            key: req.body.key,
            value: req.body.value,
            description: req.body.description
        };
        return models.Resource.create(r);
    })
    .then(resource =>
        res.json({ status: 'ok', resource: resource }))
    .catch(err =>
        res.json({ status: 'error', error: err }))
}

exports.ajaxDeleteResource = function(req, res, next) {

}

exports.ajaxModifyResource = function(req, res, next) {

}

exports.getSpeech = function(req, res, next) {
    if (!req.session.isLogin) {
        return next(new Error('Please login first'));
    }

    let urlname = req.params.urlname;
    let pSpeech = models.Speech.findOne({ where: { urlname: urlname } });
    let pResources = pSpeech.then(speech => speech.getResources());
    Promise.all([pSpeech, pResources]).then(args => {
        let speech = args[0];
        let resources = args[1];
        res.render('speech', { session: req.session, speech: speech, resources: resources });
    })
    .catch(err => next(err));
}

exports.getList = function(req, res, next) {
    if (!req.session.isLogin) {
        return next(new Error('Please login first'));
    }

    models.Speech.findAll({ include: [models.User] })
    .then(speeches => {
        console.info(speeches);
        res.render('speech_list', { session: req.session, speeches: speeches });
    })
    .catch(err => next(err));
}
