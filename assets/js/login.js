(function(window, $) {
  var Login = function() {
    var oThis = this;
    oThis.bindEvents();

    oThis.apiUrl = $('meta[name="api-url"]').attr('content');
    oThis.csrfToken = $('meta[name="csrf-token"]').attr('content');
  };

  Login.prototype = {
    bindEvents: function() {
      var oThis = this;

      $('#login-btn').click(function(event) {
        event.preventDefault();

        var data = $('#login-form').serializeArray({});

        var postData = {};

        for (var i = 0; i < data.length; i++) {
          postData[data[i].name] = data[i].value;
        }

        $.ajax({
          url: oThis.loginPostUrl(),
          type: 'POST',
          data: JSON.stringify(postData),
          headers: {
            'csrf-token': oThis.csrfToken
          },
          contentType: 'application/json',
          success: function(response) {
            if (response.data) {
              window.location = '/admin/whitelist';
            } else {
              console.error('=======Unknown response====');
            }
          },
          error: function(error) {
            var errMsg = error.responseJSON.err.error_data[0].msg;
            $('#login-error').html(errMsg);
          }
        });
      });
    },

    loginPostUrl: function() {
      var oThis = this;

      return oThis.apiUrl + '/admin/login';
    }
  };

  window.Login = Login;
})(window, jQuery);
