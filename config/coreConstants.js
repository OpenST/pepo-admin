'use strict';

/**
 * Class for core constants
 *
 * @class
 */
class CoreConstants {
  /**
   * Constructor for core constants
   *
   * @constructor
   */
  constructor() {}

  get PAD_USE_BASIC_AUTH() {
    return process.env.PAD_USE_BASIC_AUTH;
  }

  get PAD_BASIC_AUTH_USERNAME() {
    return process.env.PAD_BASIC_AUTH_USERNAME;
  }

  get PAD_BASIC_AUTH_PASSWORD() {
    return process.env.PAD_BASIC_AUTH_PASSWORD;
  }

  get isProduction() {
    return process.env.PAD_ENVIRONMENT == 'production';
  }

  get isStaging() {
    return process.env.PAD_ENVIRONMENT == 'staging';
  }

  get PAD_PA_COOKIE_SECRET() {
    return process.env.PAD_PA_COOKIE_SECRET;
  }
}

module.exports = new CoreConstants();
