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

  get COOKIE_SECRET() {
    return process.env.PAD_COOKIE_SECRET;
  }

  get PAD_DEBUG_ENABLED() {
    return process.env.PAD_DEBUG_ENABLED;
  }

  get PAD_CSRF_COOKIE_KEY() {
    return '_ad_csrf';
  }

  get PAD_CLOUD_FRONT_BASE_DOMAIN() {
    return process.env.PAD_CLOUD_FRONT_BASE_DOMAIN;
  }

  get appName() {
    return process.env.DEVOPS_APP_NAME;
  }

  get DEVOPS_ENV_ID() {
    return process.env.DEVOPS_ENV_ID;
  }

  get DEVOPS_IP_ADDRESS() {
    return process.env.DEVOPS_IP_ADDRESS;
  }

  get DEVOPS_SERVER_IDENTIFIER() {
    return process.env.DEVOPS_SERVER_IDENTIFIER;
  }
}

module.exports = new CoreConstants();
