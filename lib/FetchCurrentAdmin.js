const rootPrefix = '..',
  HttpRequest = require(rootPrefix + '/lib/http/Request'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class FetchCurrentAdmin {
  /**
   *
   * @param {Object} params
   * @param {string} params.headers
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.headers = params.headers;
    oThis.loggedInAdmin = null;
  }

  /**
   * Send get current admin request to pepo api
   *
   * @public
   */
  async perform() {
    const oThis = this;

    await oThis._fetchCurrentAdmin();

    return responseHelper.successWithData({ loggedInAdmin: oThis.loggedInAdmin });
  }

  /**
   * Fetch current admin
   *
   */
  async _fetchCurrentAdmin() {
    const oThis = this;

    let request = new HttpRequest({
      resource: coreConstants.PAD_PA_ROOT_URL + '/admin/current',
      header: oThis.headers
    });

    let response = await request.get({});

    let responseObj = JSON.parse(response.data.responseData);

    if (responseObj.success) {
      oThis.loggedInAdmin = responseObj.data.logged_in_admin;
    }

    return responseHelper.successWithData({});
  }
}

module.exports = FetchCurrentAdmin;
