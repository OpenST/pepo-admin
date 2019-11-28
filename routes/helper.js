/**
 * Route helper class.
 *
 * @module routes/helper
 */

const rootPrefix = '..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

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
      decodedParams: req.decodedParams
    });
  }
}

module.exports = RoutesHelper;
