const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = '..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstant = require(rootPrefix + '/config/coreConstants'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper');

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstant.COOKIE_SECRET));

/* Login admin*/
router.get('/login', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {

  const onServiceSuccess = async function(serviceResponse) {
    cookieHelper.setAdminCookie(res, serviceResponse.data.adminCookieValue);
  };

  const onServiceFailure = async function(serviceResponse) {
    cookieHelper.deleteAdminCookie(res);
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, 'login', 'r_a_ad_1', null, onServiceSuccess, onServiceFailure)
  );
});

/* Admin dashboard */
router.get('/user-approval', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {

  const onServiceSuccess = async function(serviceResponse) {
    
  };

  const onServiceFailure = async function(serviceResponse) {
    
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, 'userApproval', 'r_a_ad_2', null, onServiceSuccess, onServiceFailure)
  );
});

module.exports = router;