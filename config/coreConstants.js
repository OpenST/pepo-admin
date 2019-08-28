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

	get CACHE_ENGINE() {
		return process.env.PA_CACHE_ENGINE;
	}

	get MEMCACHE_SERVERS() {
		return process.env.PA_MEMCACHE_SERVERS.split(',');
	}

	get environment() {
		return process.env.PA_ENVIRONMENT;
	}

	get DEBUG_ENABLED() {
		return process.env.PA_DEBUG_ENABLED;
	}

	get MYSQL_CONNECTION_POOL_SIZE() {
		return process.env.PA_MYSQL_CONNECTION_POOL_SIZE;
	}

	get MYSQL_HOST() {
		return process.env.PA_MYSQL_HOST;
	}

	get MYSQL_USER() {
		return process.env.PA_MYSQL_USER;
	}

	get MYSQL_PASSWORD() {
		return process.env.PA_MYSQL_PASSWORD;
	}

	get environmentShort() {
		return process.env.SA_ENVIRONMENT.substring(0, 2);
	}

	get PW_USE_BASIC_AUTH() {
		return process.env.PW_USE_BASIC_AUTH;
	}

	get PW_BASIC_AUTH_USERNAME() {
		return process.env.PW_BASIC_AUTH_USERNAME;
	}

	get PW_BASIC_AUTH_PASSWORD() {
		return process.env.PW_BASIC_AUTH_PASSWORD;
	}

	get isProduction() {
		return process.env.PW_ENVIRONMENT == "production";
	}

	get isStaging() {
		return process.env.PW_ENVIRONMENT == "staging";
	}
}

module.exports = new CoreConstants();
