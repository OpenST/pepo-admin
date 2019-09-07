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
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for routes helper.
 *
 * @class RoutesHelper
 */
class RoutesHelper {
  static async perform(req, res, next, templateName, errorCode, dataFormatter, successCallback, failureCallback) {
    return res.render(templateName, {
      csrfToken: req.csrfToken(),
      apiUrl: coreConstants.PAD_PA_ROOT_URL,
      params: req.decodedParams
    });
  }
}

module.exports = RoutesHelper;
