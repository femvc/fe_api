var account = require('./routes/account');
var article = require('./routes/article');

/*
 * CORS Support in Node.js web app written with Express
 */

// http://stackoverflow.com/questions/7067966/how-to-allow-cors-in-express-nodejs
app.all('/*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    next();
});
// handle OPTIONS requests from the browser
app.options('*', function(req, res, next) { res.send(200); });

//Test
app.get('/hello', function(req, res) { res.send('hello world');});

// Account
app.get('/ue_api/account/foo'       , account.foo);
app.all('/ue_api/account/register'  , account.register);
app.all('/ue_api/account/login'     , account.login);
app.all('/ue_api/account/logout'    , account.logout);
app.get('/ue_api/account/get_detail', account.auth, account.getDetail);

//article
/* internal */
app.get('/ue_api/internal/get_articles' , article.getArticles);
app.get('/ue_api/internal/get_article'  , article.getArticle);
app.all('/ue_api/internal/save_article' , account.auth, article.saveArticle);
app.get('/ue_api/internal/remove_article', account.auth, article.removeArticle);
// Account
app.get('/account/foo', account.foo);
app.get('/account/register', account.register);
app.get('/account/login', account.login);
app.get('/account/logout', account.logout);
app.all('/account/register', account.register);
app.all('/account/login', account.login);
app.all('/account/logout', account.logout);
app.get('/account/get_detail', account.auth, account.getDetail);

