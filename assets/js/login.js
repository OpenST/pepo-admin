(function(window, $) {
  const Login = function(config) {
    const oThis = this;

    $.extend(oThis.config, config);
    oThis.bindEvents();
  };

  Login.prototype = {
    bindEvents: function() {
      const oThis = this;

      $('#login-btn').click(function(event) {
        event.preventDefault();

        var data = $('#login-form').serializeArray({});

        var postData = {};

        for (var i = 0; i < data.length; i++) {
          postData[data[i].name] = data[i].value;
        }

        var token = $('meta[name="csrf-token"]').attr('content');

        $.ajax({
          url: oThis.loginPostUrl(),
          type: 'POST',
          data: JSON.stringify(postData),
          headers: {
            'csrf-token': token
          },
          contentType: 'application/json',
          success: function(response) {
            if (response.data) {
              window.location = '/admin/user-approval';
            } else {
              console.error('=======Unknown response====');
            }
          },
          error: function(error) {
            console.error('===error', error);
          }
        });
      });
    },

    loginPostUrl: function() {
      return '/api/v1/admin/login';
    }
  };

  window.Login = Login;
})(window, jQuery);
