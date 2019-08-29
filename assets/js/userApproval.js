(function(window, $) {
  const UserApproval = function(config) {
    const oThis = this;

    $.extend(oThis.config, config);
    oThis.bindEvents();

    oThis.paginationStack = [];
    oThis.lastPaginationId = null;
    oThis.query = null;
  };

  UserApproval.prototype = {
    bindEvents: function() {
      const oThis = this;

      // Trigger search
      $('#search-btn').click(function(event) {
        event.preventDefault();

        var data = $('#user-search-form').serialize();

        oThis.query = data;

        oThis.paginationStack = [];

        oThis.loadUsers(data);
      });

      // Show previous page
      $('#users-previous-page').click(function(event) {
        event.preventDefault();

        // Pop next page's, current page's(if present) pagination id and then get prev page pagination id
        oThis.paginationStack.pop();

        if (oThis.lastPaginationId) {
          oThis.paginationStack.pop();
        }

        var pagination_id = oThis.paginationStack.pop();

        var query = oThis.query;
        if (pagination_id) {
          query = query + '&pagination_identifier=' + pagination_id;
        }

        oThis.loadUsers(query);
      });

      // Show next page
      $('#users-next-page').click(function(event) {
        event.preventDefault();

        var query = oThis.query + '&pagination_identifier=' + oThis.lastPaginationId;

        oThis.loadUsers(query);
      });
    },

    loadUsers: function(data) {
      const oThis = this;

      // Reset search results table
      $('#user-search-results').html('');

      // Disable or enable previous page button
      if (oThis.paginationStack.length == 0) {
        $('#users-previous-page').attr('aria-disabled', 'true');
        $('#users-previous-page').css('pointer-events', 'none');
      } else {
        $('#users-previous-page').attr('aria-disabled', 'false');
        $('#users-previous-page').removeClass('disabled');
        $('#users-previous-page').css('pointer-events', 'auto');
      }

      // Don't use success callback function directly. Think of oThis.
      $.ajax({
        url: oThis.adminUserSearchUrl(),
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

      var source = document.getElementById('user-row').innerHTML;
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

        if (nextPageId) {
          $('#users-next-page').attr('aria-disabled', 'false');
          $('#users-next-page').removeClass('disabled');
          $('#users-next-page').css('pointer-events', 'auto');

          oThis.paginationStack.push(nextPageId);
          oThis.lastPaginationId = nextPageId;
        } else {
          $('#users-next-page').attr('aria-disabled', 'true');
          $('#users-next-page').addClass('disabled');
          $('#users-next-page').css('pointer-events', 'none');

          oThis.lastPaginationId = null;
        }

        for (var ind = 0; ind < searchResults.length; ind++) {
          var userId = searchResults[ind]['payload'].user_id;
          var video_id = searchResults[ind]['payload'].video_id;
          var link_id = searchResults[ind]['payload'].link_id;

          var userData = response.data['users'][userId];

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

          if (userData.status == 'BLOCKED') {
            status = 'Blocked';
          }

          // Get social link
          var socialLink = '';
          if (!response.data['links'][link_id]) {
            // Nothing to do
          } else {
            socialLink = response.data['links'][link_id].url;
          }

          var context = {
            userId: userId,
            name: userData.name,
            userName: userData.user_name,
            status: status,
            videoLink: videoLink,
            socialLink: socialLink
          };

          var html = userRowTemplate(context);

          $('#user-search-results').append(html);
        }

        oThis.bindVideoModalEvents();
        oThis.bindUserStateChangeEvents();
      } else {
        console.error('=======Unknown response====', response);
      }
    },

    bindVideoModalEvents: function() {
      const oThis = this;

      var videoSource = document.getElementById('video-tray').innerHTML;
      var videoTemplate = Handlebars.compile(videoSource);

      // Add listner for video link click
      $('tr td a#video-link').click(function(event) {
        event.preventDefault();

        var videoLink = $(this).attr('href');

        $('#modal-container').html(videoTemplate({ videoLink: videoLink }));

        $('.modal').modal('show');

        // Remove the backdrop explicitly - seems to be a bootstrap bug
        $('button.close').click(function(event) {
          $('.modal-backdrop').remove();
        });

        // Stop playing video
        $('#modal-container').on('hidden.bs.modal', function(event) {
          $('.modal-backdrop').remove();
          $('#modal-container').html('');
        });
      });
    },

    bindUserStateChangeEvents: function() {
      const oThis = this;

      $('button#user-save-btn').click(function(event) {
        const button = this;

        event.preventDefault();

        var radioValue = $("input[name='userCreatorState']:checked").val();
        var user_id = +$(this).attr('data-user-id');

        var updateButtonStatus = function() {
          $(button).text = 'Saved';
          $(button).addClass('disabled');
          $(button).css('pointer-events', 'none');
        };

        if (radioValue == '1') {
          oThis.approveUserAsCreator(user_id, updateButtonStatus);
        } else if (radioValue == '2') {
          oThis.blockUser(user_id, updateButtonStatus);
        }
      });
    },

    approveUserAsCreator: function(user_id, successCallback) {
      const oThis = this;

      $.ajax({
        url: oThis.approveUserAsCreatorUrl(user_id),
        type: 'POST',
        data: {},
        contentType: 'application/json',
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

    blockUser: function(user_id, successCallback) {
      const oThis = this;

      $.ajax({
        url: oThis.blockUserUrl(user_id),
        type: 'POST',
        data: {},
        contentType: 'application/json',
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

    adminUserSearchUrl: function() {
      return '/api/v1/admin/users';
    },

    approveUserAsCreatorUrl: function(user_id) {
      return '/api/v1/admin/users/' + user_id + '/approve';
    },

    blockUserUrl: function(user_id) {
      return '/api/v1/admin/users/' + user_id + '/block';
    }
  };

  window.UserApproval = UserApproval;
})(window, jQuery);
