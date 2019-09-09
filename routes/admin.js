const express = require('express'),
  path = require('path'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = '..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstant = require(rootPrefix + '/config/coreConstants'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  adminConst = require(rootPrefix + '/lib/globalConstant/admin'),
  csrf = require('csurf');

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstant.COOKIE_SECRET));

const csrfProtection = csrf({
  cookie: {
    key: coreConstant.PAD_CSRF_COOKIE_KEY,
    maxAge: 30 * 24 * 60 * 60, // Cookie would expire after 1 month
    httpOnly: true, // The cookie only accessible by the web server
    signed: true, // Indicates if the cookie should be signed
    secure: coreConstant.isProduction, // Marks the cookie to be used with HTTPS only
    path: '/',
    sameSite: 'strict', // sets the same site policy for the cookie
    domain: coreConstant.PAD_PA_COOKIE_DOMAIN
  }
});

/* Render unauthorized page */
router.get('/unauthorized', function(req, res, next) {
  return res.sendFile(path.join(__dirname + '/' + rootPrefix + '/public/401.html'));
});

/* Login admin */
router.get(['/login', '/'], csrfProtection, sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  const onServiceSuccess = async function(serviceResponse) {};

  const onServiceFailure = async function(serviceResponse) {};

  // Delete admin login cookie
  res.clearCookie(adminConst.loginCookieName, { domain: coreConstant.PAD_PA_COOKIE_DOMAIN });

  Promise.resolve(routeHelper.perform(req, res, next, 'login', 'r_a_ad_1', null, onServiceSuccess, onServiceFailure));
});

/* Admin dashboard */
router.get('/user-approval', csrfProtection, sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  const onServiceSuccess = async function(serviceResponse) {};

  const onServiceFailure = async function(serviceResponse) {};

  Promise.resolve(
    routeHelper.perform(req, res, next, 'userApproval', 'r_a_ad_2', null, onServiceSuccess, onServiceFailure)
  );
});

/* User whitelist */
router.get('/whitelist', csrfProtection, sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  const onServiceSuccess = async function(serviceResponse) {};

  const onServiceFailure = async function(serviceResponse) {};

  Promise.resolve(
    routeHelper.perform(req, res, next, 'whitelistUser', 'r_a_ad_3', null, onServiceSuccess, onServiceFailure)
  );
});

/* User profile */
router.get('/user-profile/:user_id', csrfProtection, sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.user_id = req.params.user_id;
  const onServiceSuccess = async function(serviceResponse) {};

  const onServiceFailure = async function(serviceResponse) {};

  Promise.resolve(
    routeHelper.perform(req, res, next, 'userProfile', 'r_a_ad_4', null, onServiceSuccess, onServiceFailure)
  );
});

module.exports = router;
