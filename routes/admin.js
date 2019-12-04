const express = require('express'),
  path = require('path'),
  router = express.Router();

const rootPrefix = '..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cookieHelper = require(rootPrefix + '/helpers/cookie'),
  FetchCurrentAdmin = require(rootPrefix + '/lib/FetchCurrentAdmin');

const validateLoggedInAdmin = async function(req, res, next) {
  let response = await new FetchCurrentAdmin({ headers: req.headers }).perform().catch(function(r) {
    return responseHelper.error({
      internal_error_identifier: 'pa_r_a_1',
      api_error_identifier: 'something_went_wrong',
      debug_options: { error: r }
    });
  });

  if (response.isFailure() || !response.data.loggedInAdmin) {
    return res.redirect('/admin/login');
  } else {
    req.decodedParams.loggedInAdmin = response.data.loggedInAdmin;
  }
  next();
};

/* Render unauthorized page */
router.get('/unauthorized', function(req, res, next) {
  return res.sendFile(path.join(__dirname + '/' + rootPrefix + '/public/401.html'));
});

/*admin homepage*/
router.get('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  return res.redirect('/admin/login');
});

/* Login admin */
router.get('/login', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  // Delete admin login cookie
  cookieHelper.deleteLoginCookie(res);

  Promise.resolve(routeHelper.perform(req, res, next, 'login', 'r_a_ad_1'));
});

/* Admin dashboard */
router.get('/user-approval', sanitizer.sanitizeDynamicUrlParams, validateLoggedInAdmin, function(req, res, next) {
  req.decodedParams.viewBaseUrl = coreConstants.VIEW_ROOT_URL;
  Promise.resolve(routeHelper.perform(req, res, next, 'userApproval', 'r_a_ad_2'));
});

/* User whitelist */
router.get('/whitelist', sanitizer.sanitizeDynamicUrlParams, validateLoggedInAdmin, function(req, res, next) {
  Promise.resolve(routeHelper.perform(req, res, next, 'whitelistUser', 'r_a_ad_3'));
});

/* User profile */
router.get('/user-profile/:user_id', sanitizer.sanitizeDynamicUrlParams, validateLoggedInAdmin, function(
  req,
  res,
  next
) {
  req.decodedParams.user_id = req.params.user_id;

  Promise.resolve(routeHelper.perform(req, res, next, 'userProfile', 'r_a_ad_4'));
});

/* Usage reports */
router.get('/usage-reports', sanitizer.sanitizeDynamicUrlParams, validateLoggedInAdmin, function(req, res, next) {
  req.decodedParams.usageDataUrl = coreConstants.PAD_USAGE_DATA_URL;
  Promise.resolve(routeHelper.perform(req, res, next, 'usageReports', 'r_a_ad_5'));
});

/* Replies */
router.get('/video-replies/', sanitizer.sanitizeDynamicUrlParams, validateLoggedInAdmin, function(req, res, next) {
  req.decodedParams.video_id = req.params.video_id;
  req.decodedParams.video_id = req.params.user_id;

  Promise.resolve(routeHelper.perform(req, res, next, 'videoReplies', 'r_a_ad_6'));
});

/* Discover */
router.get('/discover', sanitizer.sanitizeDynamicUrlParams, validateLoggedInAdmin, function(req, res, next) {
  Promise.resolve(routeHelper.perform(req, res, next, 'discover', 'r_a_ad_6'));
});

module.exports = router;
