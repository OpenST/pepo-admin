(function(window, $) {
  const WhitelistUser = function(config) {
    const oThis = this;

    $.extend(oThis.config, config);
    oThis.bindEvents();

    oThis.lastPaginationId = null;
    oThis.query = null;
  };

  WhitelistUser.prototype = {
    bindEvents: function() {
      const oThis = this;

      // Trigger search
      $('#whitelist-search-btn').click(function(event) {
        event.preventDefault();

        var data = $('#whitelist-user-search-form').serialize();

        oThis.query = data;

        // Reset search results table
        $('#whitelist-user-search-results').html('');

        oThis.loadUsers(data);
      });

      // Load next page
      $('#whitelist-load-btn').click(function(event) {
        event.preventDefault();

        var query = oThis.query;
        query = query + '&pagination_identifier=' + oThis.lastPaginationId;
        oThis.loadUsers(query);
      });
    },

    loadUsers: function(data) {
      const oThis = this;

      // Don't use success callback function directly. Think of oThis.
      $.ajax({
        url: oThis.adminWhitelistUserSearchUrl(),
        type: 'GET',
        data: data,
        contentType: 'application/json',
        success: function(response) {
          oThis.userSearchSuccessCallback(response);
        },
        error: function(error) {
          console.error('===error', error);
        }
      });
    },

    userSearchSuccessCallback: function(response) {
      const oThis = this;

      var source = document.getElementById('whitelist-user-row').innerHTML;
      var userRowTemplate = Handlebars.compile(source);

      if (response.data) {
        var searchResults = response.data[response.data.result_type];

        // Handle pagination
        var nextPageId = response.data.meta.next_page_payload
          ? response.data.meta.next_page_payload['pagination_identifier']
          : null;

        if (searchResults.length == 0) {
          $('#user-search-results').append('<br/><p class="text-danger">No result found.</p>');
        }

        oThis.lastPaginationId = nextPageId;

        if (!nextPageId) {
          $('#whitelist-load-btn').css('pointer-events', 'none');
          $('#whitelist-load-btn').html("That's all!");
          $('#whitelist-load-btn').addClass('disabled');
        }

        for (var ind = 0; ind < searchResults.length; ind++) {
          var inviteId = searchResults[ind]['payload'].invite_id;
          var link_id = searchResults[ind]['payload'].link_id;

          var userData = response.data['invites'][inviteId];

          // Get video link
          var videoLink = '';
          if (!response.data['videos'][video_id]) {
            // Nothing to do
          } else {
            videoLink = response.data['videos'][video_id].resolutions['720w']
              ? response.data['videos'][video_id].resolutions['720w'].url
              : response.data['videos'][video_id].resolutions['original'].url;
          }

          var status = userData.approved_creator ? 'Approved' : 'Pending';

          if (userData.status == 'INACTIVE') {
            status = 'Blocked';
          }

          // Get social link
          var socialLink = '';
          if (!response.data['links'][link_id]) {
            // Nothing to do
          } else {
            socialLink = response.data['links'][link_id].url;
          }

          var adminAction = response.data['adminActions'][inviteId];

          if (adminAction) {
            adminAction.createdAt = new Date(adminAction.createdAt).toDateString();
          }

          var context = {
            inviteId: inviteId,
            name: userData.name,
            userName: userData.user_name,
            status: status,
            videoLink: videoLink,
            socialLink: socialLink,
            adminAction: adminAction
          };

          var html = userRowTemplate(context);

          $('#user-search-results').append(html);
        }

        oThis.bindUserStateChangeEvents();
      } else {
        console.error('=======Unknown response====', response);
      }
    },

    bindUserStateChangeEvents: function() {
      const oThis = this;

      $('button#whitelist-user-save-btn').click(function(event) {
        const button = this;

        event.preventDefault();

        var invite_id = +$(this).attr('data-invite-id');

        var updateButtonStatus = function() {
          $(button).html('Saved');
          $(button).addClass('disabled');
          $(button).css('pointer-events', 'none');
        };

        oThis.whitelistUser(invite_id, updateButtonStatus);
      });
    },

    whitelistUser: function(invite_id, successCallback) {
      const oThis = this;

      var token = $('meta[name="csrf-token"]').attr('content');

      $.ajax({
        url: oThis.whitelistUser(invite_id),
        type: 'POST',
        data: {},
        contentType: 'application/json',
        headers: {
          'csrf-token': token
        },
        success: function(response) {
          if (response.data) {
            successCallback();
          } else {
            console.error('=======Unknown response====');
          }
        },
        error: function(error) {
          console.error('===error', error);
        }
      });
    },

    adminWhitelistUserSearchUrl: function() {
      return '/api/admin/launch-invites/search';
    },

    whitelistUser: function(invite_id) {
      return '/api/admin/whitelist/' + invite_id;
    }
  };

  window.WhitelistUser = WhitelistUser;
})(window, jQuery);
