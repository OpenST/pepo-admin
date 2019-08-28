
(function(window, $){
	const Common = function(config) {

	};

	Common.prototype = {
		init: function() {
			const oThis = this;

      $.ajax({
          url: oThis.currentAdminUrl(),
          type: 'GET',
          data: {},
          contentType: "application/json",
          success: function(response) {
            $('#logout a').removeAttr('hidden');
          },
          error: function(error) {
            $('#login a').removeAttr('hidden');
          }
      }); 

      oThis.bindEvents();
		},

		bindEvents: function() {
			const oThis = this;

			$('#logout a').click(function(event) {
				event.preventDefault();

				$.ajax({
	          url: oThis.logoutUrl(),
	          type: 'POST',
	          data: {},
	          contentType: "application/json",
	          success: function(response) {

	          	console.log("===response", response);

	            //window.location = '/admin/login';
	            $('#login a').removeAttr('hidden');
	          },
	          error: function(error) {
	            console.log("===Loggout request failed");
	          }
	      }); 
			});
		},

		logoutUrl: function() {
			const oThis = this;

			return '/api/v1/admin/logout';
		},

		currentAdminUrl: function() {
			const oThis = this;

			return '/api/v1/admin/current';
		}
	};

	window.Common = Common;
})(window, jQuery);