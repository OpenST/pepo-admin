const csrf = require('csurf');

const rootPrefix = '..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  cookieConstants = require(rootPrefix + '/lib/globalConstant/cookie');

const cookieDefaultOptions = {
  httpOnly: true,
  signed: true,
  path: '/',
  domain: coreConstants.PAD_PA_COOKIE_DOMAIN,
  secure: basicHelper.isProduction(),
  sameSite: 'strict'
};

class CookieHelper {
  /**
   * Set Csrf for Admin.
   *
   */
  setAdminCsrf() {
    let cookieParams = Object.assign({}, cookieDefaultOptions, {
      maxAge: 60 * 60 * 24 * 30, // Cookie would expire after 30 day
      key: cookieConstants.csrfCookieName
    });

    return csrf({
      cookie: cookieParams
    });
  }

  /**
   * Delete login cookie.
   *
   * @param {object} responseObject
   */
  deleteLoginCookie(responseObject) {
    responseObject.clearCookie(cookieConstants.loginCookieName, { domain: coreConstants.PAD_PA_COOKIE_DOMAIN });
  }
}

module.exports = new CookieHelper();
