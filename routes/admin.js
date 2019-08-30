const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = '..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstant = require(rootPrefix + '/config/coreConstants'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  csrf = require('csurf');

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstant.PW_PA_COOKIE_SECRET));

const csrfProtection = csrf({
  cookie: {
    maxAge: 1000 * 5 * 60, // Cookie would expire after 5 minutes
    httpOnly: true, // The cookie only accessible by the web server
    signed: true, // Indicates if the cookie should be signed
    secure: true, // Marks the cookie to be used with HTTPS only
    path: '/',
    sameSite: 'strict', // sets the same site policy for the cookie
    domain: coreConstant.PW_PA_COOKIE_DOMAIN
  }
});

/* Login admin*/
router.get('/login', csrfProtection, sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  const onServiceSuccess = async function(serviceResponse) {};

  const onServiceFailure = async function(serviceResponse) {};

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

module.exports = router;
