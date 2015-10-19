'use strict';

const Promise = require('bluebird');
const utils = require('../utils');
const models = require('../models');
const config = require('../config');

exports.getNewSpeech = function(req, res, next) {
    if (!req.session.isAdmin) {
        return next(new Error('Permission Denied'));
    }

    res.render('speech_new', { session: req.session, });
}

exports.postNewSpeech = function(req, res, next) {
    if (!req.session.isAdmin) {
        return next(new Error('Permission Denied'));
    }

    let s = models.Speech.parse(req.body);
    models.Speech.create(s).then(speech => {
        res.redirect(`${config.root}s/${speech.urlname}`);
    })
    .catch(err => next(err));
}

exports.getModify = function(req, res, next) {
    let urlname = req.params.urlname;
    let pSpeech = models.Speech.findOne({ where: { urlname: urlname } });
    let pResources = pSpeech.then(speech => speech.getResources());
    let pSpeaker = pSpeech.then(speech => models.User.findOne({ where: { studentID: speech.studentID }}));
    let pStaffs = pResources.then(findStaffProfiles);
    Promise.join(pSpeech, pResources, pSpeaker, pStaffs, (speech, resources, speaker, staffs) => {
        let resobj = classifyResources(resources);
        let staffobj = mapStudentID(staffs);
        res.render('speech_modify', {
            session: req.session,
            speech: speech,
            speaker: speaker,
            resources: resobj,
            staffs: staffobj
        })
    })
    .catch(next);
}

exports.postModify = function(req, res, next) {
    let urlname = req.params.urlname;
    let r = {
        type: req.body.type,
        key: req.body.key,
        value: req.body.value,
        description: req.body.description
    };

    let pSpeech = models.Speech.findOne({ where: { urlname: urlname } });
    let pSpeaker = pSpeech.then(speech => models.User.findOne({ where: { studentID: speech.studentID }}));
    let pPermission = pSpeech.then(speech => {
        let p = speech.studentID == req.session.user.studentID || req.session.isAdmin;
        if (!p) throw new Error('Permission Denied');
        return true;
    });

    if (req.body.type === 'basic') {
        Promise.join(pSpeech, pSpeaker, pPermission, (speech, speaker, _) => {
            let s = models.Speech.parse(req.body);
            s.studentID = speech.studentID;
            s.id = speech.id;
            speech.update(s).then(() => {
                res.redirect(`${config.root}s/${speech.urlname}/modify`);
            })
        });
        return;
    }

    let pCreateResosurce = pPermission.then(() => models.Resource.create(r));
    let pAssociateResource = Promise.join(pSpeech, pCreateResosurce, (speech, resource) => {
        speech.addResource(resource);
    });

    Promise.join(pSpeech, pSpeaker, pPermission, pCreateResosurce, pAssociateResource,
        (speech, speaker, _1, resource, _2) => {
            res.redirect(`${config.root}s/${speech.urlname}/modify`);
        })
    .catch(next);
}

exports.getSpeech = function(req, res, next) {
    if (!req.session.isLogin) {
        return next(new Error('请先登入'));
    }

    let urlname = req.params.urlname;
    let pSpeech = models.Speech.findOne({ where: { urlname: urlname } }).then(speech => {
        if (!speech) throw new Error('该演讲不存在');
        return speech.increment('views');
    });
    let pResources = pSpeech.then(speech => speech.getResources());
    let pSpeaker = pSpeech.then(speech => models.User.findOne({ where: { studentID: speech.studentID }}));
    let pStaffs = pResources.then(findStaffProfiles);
    Promise.join(pSpeech, pResources, pSpeaker, pStaffs, (speech, resources, speaker, staffs) => {
        let resobj = classifyResources(resources);
        let staffobj = mapStudentID(staffs);
        res.render('speech', {
            session: req.session,
            speech: speech,
            resources: resobj,
            speaker: speaker,
            staffs: staffobj,
            canModify: true
        });
    })
    .catch(err => next(err));
}

function findStaffProfiles(resources) {
    let ids = [];
    resources.forEach(res => {
        if (res.type === 'staff') ids.push(res.value);
    });
    return models.User.findAll({ where: { studentID: { $in: ids } } });
}

function classifyResources(resources) {
    let resobj = {};
    resources.forEach(r => {
        if (!(r.key in resobj)) resobj[r.key] = [];
        resobj[r.key].push(r);
    });
    for (let key in resobj) {
        resobj[key].sort((a, b) => a.priority - b.priority);
    }
    return resobj;
}

function mapStudentID(staffs) {
    let staffobj = {};
    staffs.forEach(u => staffobj[u.studentID] = u);
    return staffobj;
}

function findSpeakerProfiles(speeches) {
    let ids = speeches.map(s => s.studentID);
    return models.User.findAll({ where: { studentID: { $in: ids } } });
}

exports.getList = function(req, res, next) {
    let pSpeeches = models.Speech.findAll();
    let pSpeakers = pSpeeches.then(findSpeakerProfiles);
    Promise.join(pSpeeches, pSpeakers, (speeches, speakers) => {
        let obj_speakers = mapStudentID(speakers);
        res.render('speech_list', {
            session: req.session, 
            speeches: speeches,
            speakers: obj_speakers
        })
    })
    .catch(err => next(err));
}
