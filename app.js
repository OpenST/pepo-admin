const rootPrefix = '.';

const express = require('express'),
  path = require('path'),
  createNamespace = require('continuation-local-storage').createNamespace,
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  basicAuth = require('basic-auth'),
  helmet = require('helmet'),
  customUrlParser = require('url'),
  exphbs = require('express-handlebars');

const responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  customMiddleware = require(rootPrefix + '/helpers/customMiddleware'),
  adminRoutes = require(rootPrefix + '/routes/admin'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  errorConfig = require(rootPrefix + '/config/apiErrorConfig'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  handlebarHelper = require(rootPrefix + '/helpers/handlebar'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

const requestSharedNameSpace = createNamespace('pepoWebNameSpace');

morgan.token('id', function getId(req) {
  return req.id;
});

morgan.token('endTime', function getendTime(req) {
  const hrTime = process.hrtime();

  return hrTime[0] * 1000 + hrTime[1] / 1000000;
});

morgan.token('endDateTime', function getEndDateTime(req) {
  return basicHelper.logDateFormat();
});

const startRequestLogLine = function(req, res, next) {
  const message =
    "Started '" +
    customUrlParser.parse(req.originalUrl).pathname +
    "'  '" +
    req.method +
    "' at " +
    basicHelper.logDateFormat();

  logger.info(message);

  next();
};

/**
 * Assign params
 *
 * @param req
 * @param res
 * @param next
 */
const assignParams = function(req, res, next) {
  // IMPORTANT NOTE: Don't assign parameters before sanitization
  // Also override any request params, related to signatures
  // And finally assign it to req.decodedParams
  req.decodedParams = Object.assign(getRequestParams(req), req.decodedParams);

  next();
};

/**
 * Get request params
 *
 * @param req
 * @return {*}
 */
const getRequestParams = function(req) {
  // IMPORTANT NOTE: Don't assign parameters before sanitization
  if (req.method === 'POST') {
    return req.body;
  } else if (req.method === 'GET') {
    return req.query;
  }

  return {};
};

// Set request debugging/logging details to shared namespace
const appendRequestDebugInfo = function(req, res, next) {
  requestSharedNameSpace.run(function() {
    requestSharedNameSpace.set('reqId', req.id);
    requestSharedNameSpace.set('startTime', req.startTime);
    next();
  });
};

const basicAuthentication = function(req, res, next) {
  if (coreConstants.PW_USE_BASIC_AUTH == 'false') {
    return next();
  }

  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');

    return responseHelper
      .error({
        internal_error_identifier: 'a_1',
        api_error_identifier: 'unauthorized_api_request',
        debug_options: {}
      })
      .renderResponse(res, {
        api_error_config: errorConfig
      });
  }

  let user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  }

  if (user.name === coreConstants.PW_BASIC_AUTH_USERNAME && user.pass === coreConstants.PW_BASIC_AUTH_PASSWORD) {
    return next();
  } else {
    return unauthorized(res);
  }
};

// If the process is not a master

// Set worker process title
process.title = 'pepo web node worker';

// Create express application instance
const app = express();

// Add id and startTime to request
app.use(customMiddleware());

// Load Morgan
app.use(
  morgan(
    '[:id][:endTime] Completed with ":status" in :response-time ms at :endDateTime -  ":res[content-length] bytes" - ":remote-addr" ":remote-user" - "HTTP/:http-version :method :url" - ":referrer" - ":user-agent"'
  )
);

// Helmet helps secure Express apps by setting various HTTP headers.
app.use(helmet());

// Node.js body parsing middleware.
app.use(bodyParser.json());

// Parsing the URL-encoded data with the qs library (extended: true)
app.use(bodyParser.urlencoded({ extended: true }));

//Setting view engine template handlebars
app.set('views', path.join(__dirname, 'views'));

//Helper is used to ease stringifying JSON
app.engine(
  'handlebars',
  exphbs({
    defaultLayout: 'main',
    helpers: handlebarHelper,
    partialsDir: path.join(__dirname, 'views/partials'),
    layoutsDir: path.join(__dirname, 'views/layouts')
  })
);
app.set('view engine', 'handlebars');

// connect-assets relies on to use defaults in config
const connectAssetConfig = {
  paths: [path.join(__dirname, 'assets/css'), path.join(__dirname, 'assets/js')],
  buildDir: path.join(__dirname, 'builtAssets'),
  fingerprinting: true,
  servePath: 'assets'
};

if (coreConstants.isProduction || coreConstants.isStaging) {
  connectAssetConfig.servePath = coreConstants.CLOUD_FRONT_BASE_DOMAIN + '/pepo-web/js-css';
  connectAssetConfig.bundle = true;
  connectAssetConfig.compress = true;
}

const connectAssets = require('connect-assets')(connectAssetConfig);
app.use(connectAssets);

const hbs = require('handlebars');
hbs.registerHelper('css', function() {
  const css = connectAssets.options.helperContext.css.apply(this, arguments);

  return new hbs.SafeString(css);
});

hbs.registerHelper('js', function() {
  const js = connectAssets.options.helperContext.js.apply(this, arguments);
  return new hbs.SafeString(js);
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/public/pepo.html'));
});

app.use(
  '/admin',
  basicAuthentication,
  startRequestLogLine,
  appendRequestDebugInfo,
  sanitizer.sanitizeBodyAndQuery,
  assignParams,
  adminRoutes
);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  const message =
    "Started '" +
    customUrlParser.parse(req.originalUrl).pathname +
    "'  '" +
    req.method +
    "' at " +
    basicHelper.logDateFormat();
  logger.info(message);

  return responseHelper
    .error({
      internal_error_identifier: 'a_2',
      api_error_identifier: 'resource_not_found',
      debug_options: {}
    })
    .renderResponse(res, { api_error_config: errorConfig });
});

// Error handler
app.use(function(err, req, res, next) {
  logger.error('a_6', 'Something went wrong', err);

  return responseHelper
    .error({
      internal_error_identifier: 'a_3',
      api_error_identifier: 'something_went_wrong',
      debug_options: {}
    })
    .renderResponse(res, { api_error_config: errorConfig });
});

module.exports = app;
