(function(window, $){

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

      	let data = $("#login-form").serializeArray({});

      	let postData = {};

      	for(let i = 0; i < data.length; i++) {
      		postData[data[i].name] = data[i].value;
      	}

	      $.ajax({
          url: oThis.loginPostUrl(),
          type: 'POST',
          data: JSON.stringify(postData),
          contentType: "application/json",
          success: function (response) {

            if(response.data) {
							window.location = "/admin/user-approval"
            } else {         
 							console.error("=======Unknown response====");
            }
          },
          error: function(error) {
          	console.error("===error", error);
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