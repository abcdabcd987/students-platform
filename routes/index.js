var express = require('express');
var router = express.Router();

var user = require('./user');
var speech = require('./speech');
var admin = require('./admin');

router.get('/', function (req, res, next) { res.render('index', { session: req.session }) });

router.post('/user/login', user.postLogin);
//router.get ('/user/register', user.getRegister);
//router.post('/user/register', user.postRegister);
router.get ('/user/modify', user.getModify);
router.post('/user/modify', user.postModify);
router.get ('/user/logout', user.getLogout);

router.get ('/speech/new', speech.getNewSpeech);
router.post('/speech/new', speech.postNewSpeech);
router.get ('/speech/list', speech.getList);
router.get ('/s/:urlname', speech.getSpeech);
router.get ('/s/:urlname/modify', speech.getModify);
router.post('/s/:urlname/modify', speech.postModify);

router.get ('/admin/bulk_register', admin.getBulkRegister);
router.post('/admin/bulk_register', admin.postBulkRegister);

module.exports = router;
