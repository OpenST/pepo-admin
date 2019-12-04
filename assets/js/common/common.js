(function(window, $) {
  var Common = function(config) {};

  Common.prototype = {
    init: function() {
      var oThis = this;

      oThis.apiUrl = $('meta[name="api-url"]').attr('content');

      oThis.registerHandlebarHelpers();

      oThis.bindEvents();
    },

    registerHandlebarHelpers: function() {
      var oThis = this;

      Handlebars.registerHelper('ifCond', function(v1, operator, v2, options) {
        switch (operator) {
          case '==':
            return v1 == v2 ? options.fn(this) : options.inverse(this);
          case '===':
            return v1 === v2 ? options.fn(this) : options.inverse(this);
          case '!=':
            return v1 != v2 ? options.fn(this) : options.inverse(this);
          case '!==':
            return v1 !== v2 ? options.fn(this) : options.inverse(this);
          case '<':
            return v1 < v2 ? options.fn(this) : options.inverse(this);
          case '<=':
            return v1 <= v2 ? options.fn(this) : options.inverse(this);
          case '>':
            return v1 > v2 ? options.fn(this) : options.inverse(this);
          case '>=':
            return v1 >= v2 ? options.fn(this) : options.inverse(this);
          case '&&':
            return v1 && v2 ? options.fn(this) : options.inverse(this);
          case '||':
            return v1 || v2 ? options.fn(this) : options.inverse(this);
          default:
            return options.inverse(this);
        }
      });
    },

    bindEvents: function() {
      var oThis = this;

      var token = $('meta[name="csrf-token"]').attr('content');

      $('#logout a').click(function(event) {
        event.preventDefault();

        $.ajax({
          url: oThis.logoutUrl(),
          type: 'POST',
          data: {},
          headers: {
            'csrf-token': token
          },
          contentType: 'application/json',
          success: function(response) {
            $('#login a').removeAttr('hidden');
            window.location = '/admin/login';
          },
          error: function(error) {
            console.log('===Loggout request failed');
          }
        });
      });
    },

    logoutUrl: function() {
      var oThis = this;

      return oThis.apiUrl + '/admin/logout';
    },

    currentAdminUrl: function() {
      var oThis = this;

      return oThis.apiUrl + '/admin/current';
    }
  };

  window.Common = Common;
})(window, jQuery);
