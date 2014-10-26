var account = require('./routes/account');
var question = require('./routes/question');
var paper = require('./routes/paper');
var result = require('./routes/result');
var rank = require('./routes/rank');
var cloudlabel = require('./routes/cloudlabel');

/*
 * CORS Support in Node.js web app written with Express
 */

// http://stackoverflow.com/questions/7067966/how-to-allow-cors-in-express-nodejs
app.all('/*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    next();
});
// handle OPTIONS requests from the browser
app.options('*', function (req, res, next) {
    res.send(200);
});

//Test
app.get('/hello', function (req, res) {
    res.send('hello world');
});

// Account
app.get('/ue_api/account/foo', account.foo);
app.all('/ue_api/account/register', account.register);
app.all('/ue_api/account/login', account.login);
app.all('/ue_api/account/logout', account.logout);
app.get('/ue_api/account/get_detail', account.auth, account.getDetail);
app.get('/ue_api/account/get_uid', account.auth, account.getUid);

//question
// internal 
app.get('/ue_api/internal/get_questions', account.auth, question.getQuestions);
app.get('/ue_api/internal/get_question', account.auth, question.getQuestion);
app.all('/ue_api/internal/save_question', account.auth, question.saveQuestion);
app.get('/ue_api/internal/remove_question', account.auth, question.removeQuestion);

app.all('/ue_api/internal/get_next_question', account.auth, paper.getNextQuestion);
app.all('/ue_api/internal/save_next_question', account.auth, paper.saveNextQuestion);
app.all('/ue_api/internal/get_papers', account.auth, paper.getPapers);
app.all('/ue_api/internal/get_paper_result', account.auth, paper.getPaperResult);

app.all('/ue_api/internal/get_result', account.auth, result.getResult);
app.all('/ue_api/internal/get_results', account.auth, result.getResults);

app.all('/ue_api/internal/get_rank', account.auth, rank.getRank);
app.all('/ue_api/internal/get_ranks', account.auth, rank.getRanks);
app.all('/ue_api/internal/save_rank', account.auth, rank.saveRank);
app.all('/ue_api/internal/update_rank', account.auth, rank.updateRank);

app.all('/ue_api/internal/save_cloudlabel', account.auth, cloudlabel.saveCloudlabel);
app.all('/ue_api/internal/get_cloudlabels', account.auth, cloudlabel.getCloudlabels);

// Account
app.get('/account/foo', account.foo);
app.get('/account/register', account.register);
app.get('/account/login', account.login);
app.get('/account/logout', account.logout);
app.all('/account/register', account.register);
app.all('/account/login', account.login);
app.all('/account/logout', account.logout);
app.get('/account/get_detail', account.auth, account.getDetail);
// */