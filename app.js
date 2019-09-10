const rootPrefix = '.';

const express = require('express'),
  path = require('path'),
  createNamespace = require('continuation-local-storage').createNamespace,
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  basicAuth = require('basic-auth'),
  helmet = require('helmet'),
  customUrlParser = require('url'),
  cookieParser = require('cookie-parser'),
  exphbs = require('express-handlebars');

const responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  customMiddleware = require(rootPrefix + '/helpers/customMiddleware'),
  adminRoutes = require(rootPrefix + '/routes/admin'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  errorConfig = require(rootPrefix + '/config/apiErrorConfig'),
  cookieHelper = require(rootPrefix + '/helpers/cookie'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  handlebarHelper = require(rootPrefix + '/helpers/handlebar'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

const requestSharedNameSpace = createNamespace('pepoAdminNameSpace');

morgan.token('id', function getId(req) {
  return req.id;
});

morgan.token('endTime', function getendTime(req) {
  const hrTime = process.hrtime();

  return hrTime[0] * 1000 + hrTime[1] / 1000000;
});

morgan.token('currentDateTime', function getCurrentDateTime(req) {
  return basicHelper.logDateFormat();
});

const startRequestLogLine = function(req, res, next) {
  const message =
    '[' +
    req.id +
    ']' +
    "Started '" +
    customUrlParser.parse(req.originalUrl).pathname +
    "'  '" +
    req.method +
    "' at " +
    basicHelper.logDateFormat() +
    ' from agent ' +
    req.headers['user-agent'];

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
  if (!coreConstants.USE_BASIC_AUTH) {
    return next();
  }

  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');

    res.status(401);

    return res.sendFile(path.join(__dirname + '/' + rootPrefix + '/public/401.html'));
  }

  let user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  }

  if (user.name === coreConstants.PAD_BASIC_AUTH_USERNAME && user.pass === coreConstants.PAD_BASIC_AUTH_PASSWORD) {
    return next();
  } else {
    return unauthorized(res);
  }
};

// If the process is not a master

// Set worker process title
process.title = 'pepo admin node worker';

// Create express application instance
const app = express();

// Add id and startTime to request
app.use(customMiddleware());

// Load Morgan
app.use(
  morgan('[:id][:currentDateTime] Completed with ":status" in :response-time ms -  ":res[content-length] bytes"')
);

// Helmet helps secure Express apps by setting various HTTP headers.
app.use(helmet());

//Setting view engine template handlebars
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

// Node.js body parsing middleware.
app.use(bodyParser.json());

// Parsing the URL-encoded data with the qs library (extended: true)
app.use(bodyParser.urlencoded({ extended: true }));

// Sanitize request body and query params
// NOTE: dynamic variables in URL will be sanitized in routes
app.use(sanitizer.sanitizeBodyAndQuery, assignParams);

app.use(basicAuthentication);

// Node.js cookie parsing middleware.
app.use(cookieParser(coreConstants.COOKIE_SECRET));

app.use(cookieHelper.setAdminCsrf());

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

const hbs = require('handlebars');
hbs.registerHelper('css', function() {
  const css = connectAssets.options.helperContext.css.apply(this, arguments);

  return new hbs.SafeString(css);
});

hbs.registerHelper('js', function() {
  const js = connectAssets.options.helperContext.js.apply(this, arguments);
  return new hbs.SafeString(js);
});

hbs.registerHelper('json', function(context) {
  return JSON.stringify(context);
});

app.use(express.static(path.join(__dirname, 'public')));

app.use(appendRequestDebugInfo, startRequestLogLine);

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/public/pepo.html'));
});

app.use('/admin', adminRoutes);

// connect-assets relies on to use defaults in config
const connectAssetConfig = {
  paths: [path.join(__dirname, 'assets/css'), path.join(__dirname, 'assets/js')],
  buildDir: path.join(__dirname, 'builtAssets'),
  fingerprinting: true,
  servePath: 'assets'
};

if (coreConstants.isProduction || coreConstants.isStaging) {
  connectAssetConfig.servePath = coreConstants.PAD_CLOUD_FRONT_BASE_DOMAIN + '/' + coreConstants.appName + '/js-css';
  connectAssetConfig.bundle = true;
  connectAssetConfig.compress = true;
} else {
  connectAssetConfig.servePath = 'builtAssets';
}

const connectAssets = require('connect-assets')(connectAssetConfig);
app.use(connectAssets);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  const message =
    "Started '" +
    customUrlParser.parse(req.originalUrl).pathname +
    "'  '" +
    req.method +
    "' at " +
    basicHelper.logDateFormat() +
    ' from agent ' +
    req.headers['user-agent'];
  logger.info(message);

  return res.sendFile(path.join(__dirname + '/public/404.html'));
});

// Error handler
app.use(function(err, req, res, next) {
  logger.error('a_6', 'Something went wrong', err);

  return res.sendFile(path.join(__dirname + '/public/500.html'));
});

module.exports = app;
