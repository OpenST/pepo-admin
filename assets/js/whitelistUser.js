(function(window, $) {
  const WhitelistUser = function(config) {
    const oThis = this;

    oThis.config = {};

    $.extend(oThis.config, config);
    oThis.bindEvents();

    oThis.lastPaginationId = null;
    oThis.query = null;

    oThis.apiUrl = $('meta[name="api-url"]').attr('content');
    oThis.csrfToken = $('meta[name="csrf-token"]').attr('content');

    $('#whitelist-link').addClass('active');
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

      // Apply sort filter
      $('#user-sort').change(function(event) {
        event.preventDefault();

        var sortBy = $(this)
          .children('option:selected')
          .val();

        var query = oThis.query;

        if (sortBy != 0) {
          query = query + '&sort_by=' + sortBy;
        }

        $('#whitelist-user-search-results').html('');
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
          $('#videos-load-btn').removeClass('hidden');
          oThis.userSearchSuccessCallback(response);
        },
        error: function(error) {
          console.error('===error', error);

          $('#videos-load-btn').addClass('hidden');
          if (error.responseJSON.err.code == 'UNAUTHORIZED') {
            window.location = '/admin/unauthorized';
          }
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

          var inviteData = response.data['invites'][inviteId];

          var whitelistStatus = inviteData.admin_status == 'WHITELISTED' ? 'Whitelisted' : 'Pending';

          var creatorStatus = '';

          switch (inviteData.creator_status) {
            case 'NOT_APPLIED':
              creatorStatus = 'Not Requested';
              break;
            case 'APPROVED':
              creatorStatus = 'Approved';
              break;
            default:
              creatorStatus = 'APPLIED';
          }

          var context = {
            inviteId: inviteId,
            name: inviteData.name,
            userName: inviteData.handle,
            status: whitelistStatus,
            invitedUserCount: inviteData.invited_user_count,
            creatorStatus: creatorStatus,
            email: inviteData.email
          };

          $('#total-count').html('Total Count: ' + response.data.meta.total_no);

          var html = userRowTemplate(context);

          $('#whitelist-user-search-results').append(html);
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
          $(button)
            .parent()
            .prev()
            .prev()
            .html('Whitelisted');
        };

        oThis.whitelistUser(invite_id, updateButtonStatus);
      });

      $('button#creator-approve-save-btn').click(function(event) {
        const button = this;

        event.preventDefault();

        var invite_id = +$(this).attr('data-invite-id');

        var updateButtonStatus = function() {
          $(button).html('Saved');
          $(button).addClass('disabled');
          $(button).css('pointer-events', 'none');
          $(button)
            .parent()
            .html('Approved');
        };

        oThis.approveUser(invite_id, updateButtonStatus);
      });
    },

    approveUser: function(invite_id, successCallback) {
      const oThis = this;

      $.ajax({
        url: oThis.approveUserUrl(invite_id),
        type: 'POST',
        data: {},
        contentType: 'application/json',
        headers: {
          'csrf-token': oThis.csrfToken
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

          if (error.responseJSON.err.code == 'UNAUTHORIZED') {
            window.location = '/admin/unauthorized';
          }
        }
      });
    },

    whitelistUser: function(invite_id, successCallback) {
      const oThis = this;

      $.ajax({
        url: oThis.whitelistUserUrl(invite_id),
        type: 'POST',
        data: {},
        contentType: 'application/json',
        headers: {
          'csrf-token': oThis.csrfToken
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

          if (error.responseJSON.err.code == 'UNAUTHORIZED') {
            window.location = '/admin/unauthorized';
          }
        }
      });
    },

    adminWhitelistUserSearchUrl: function() {
      const oThis = this;

      return oThis.apiUrl + '/admin/pre-launch/users/search';
    },

    whitelistUserUrl: function(invite_id) {
      const oThis = this;

      return oThis.apiUrl + '/admin/pre-launch/whitelist/' + invite_id;
    },

    approveUserUrl: function(invite_id) {
      const oThis = this;

      return oThis.apiUrl + '/admin/pre-launch/approve/' + invite_id;
    }
  };

  window.WhitelistUser = WhitelistUser;
})(window, jQuery);
