/**
 * Route helper class.
 *
 * @module routes/helper
 */

const rootPrefix = '..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  handlebarHelper = require(rootPrefix + '/helpers/handlebar'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  HttpRequest = require(rootPrefix + '/lib/http/Request'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for routes helper.
 *
 * @class RoutesHelper
 */
class RoutesHelper {
  static async perform(req, res, next, templateName, errorCode, dataFormatter, successCallback, failureCallback) {
    let loggedInAdmin = null;

    if (req.originalUrl !== '/admin/login') {
      loggedInAdmin = await RoutesHelper._fetchCurrentAdmin(req.headers);
    }

    return res.render(templateName, {
      csrfToken: req.csrfToken(),
      apiUrl: coreConstants.PAD_PA_ROOT_URL,
      params: req.decodedParams,
      loggedInAdmin: loggedInAdmin
    });
  }

  /**
   * Fetch current admin
   *
   */
  static async _fetchCurrentAdmin(headers) {
    const oThis = this;

    let request = new HttpRequest({ resource: coreConstants.PAD_PA_ROOT_URL + '/admin/current', header: headers });

    let response = await request.get({});

    let loggedInAdmin = null;

    let responseObj = JSON.parse(response.data.responseData);

    if (responseObj.success) {
      loggedInAdmin = responseObj.data.logged_in_admin;
    }

    return loggedInAdmin;
  }
}

module.exports = RoutesHelper;
