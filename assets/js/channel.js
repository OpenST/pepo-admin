(function(window, $) {
  var Channel = function() {
    var oThis = this;

    oThis.config = {};

    oThis.apiUrl = $('meta[name="api-url"]').attr('content');

    oThis.createEditBtn = $('#create-edit-channel');

    oThis.bindEvents();
  };

  Channel.prototype = {
    bindEvents: function() {
      var oThis = this;

      // Generate report
      $(oThis.createEditBtn).click(function(event) {
        event.preventDefault();

        console.log('kya yeh kia....');

        $(oThis.createEditBtn).css('pointer-events', 'none');
        $(oThis.createEditBtn).html('Processing!...');
        $(oThis.createEditBtn).addClass('disabled');

        var successCallback = function() {
          $(oThis.createEditBtn).css('pointer-events', 'auto');
          $(oThis.createEditBtn).html('Create / Edit');
          $(oThis.createEditBtn).removeClass('disabled');
        };

        oThis.createEditChannel(successCallback);
      });
    },

    createEditChannel: function(successCallback) {
      var oThis = this;

      alert('yyehhhha se request mardo');
      return;
      // send ajax to api to create edit channel.
      $.ajax({
        url: oThis.apiUrl + '/admin/channel/edit',
        type: 'POST',
        data: {},
        contentType: 'application/json',
        success: function(response) {
          if (response.data) {
            successCallback();
          } else {
            console.error('=======Unknown response====', response);
          }
        },
        error: function(error) {
          console.error('===error', error);

          if (error.responseJSON.err.code == 'UNAUTHORIZED') {
            window.location = '/admin/unauthorized';
          }
        }
      });
    }
  };

  window.Channel = Channel;
})(window, jQuery);
