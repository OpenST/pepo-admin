(function(window, $) {
  const UserApproval = function(config) {
    const oThis = this;

    $.extend(oThis.config, config);
    oThis.bindEvents();

    oThis.lastPaginationId = null;
    oThis.query = null;

    oThis.apiUrl = $('meta[name="api-url"]').attr('content');

    $('#user-approval-link').addClass('active');
  };

  UserApproval.prototype = {
    bindEvents: function() {
      const oThis = this;

      // Trigger search
      $('#search-btn').click(function(event) {
        event.preventDefault();

        var data = $('#user-search-form').serialize();

        oThis.query = data;

        // Reset search results table
        $('#user-search-results').html('');

        oThis.loadUsers(data);
      });

      // Load next page
      $('#load-btn').click(function(event) {
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

        oThis.lastPaginationId = nextPageId;

        if (!nextPageId) {
          $('#load-btn').css('pointer-events', 'none');
          $('#load-btn').html("That's all!");
          $('#load-btn').addClass('disabled');
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

          // Get image link
          var imageLink = '';
          if (!userData.profile_image_id) {
            // Nothing to do
          } else {
            var profile_image_id = userData.profile_image_id;

            imageLink = response.data['images'][profile_image_id].resolutions['144w']
              ? response.data['images'][profile_image_id].resolutions['144w'].url
              : response.data['images'][profile_image_id].resolutions['original'].url;
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

          var adminAction = response.data['admin_actions'][userId];

          if (adminAction) {
            adminAction.createdAt = new Date(adminAction.createdAt * 1000).toDateString();
          }

          var context = {
            userId: userId,
            name: userData.name,
            userName: userData.user_name,
            status: status,
            videoLink: videoLink,
            socialLink: socialLink,
            adminAction: adminAction,
            imageLink: imageLink
          };

          var html = userRowTemplate(context);

          $('#user-search-results').append(html);
        }

        oThis.bindVideoModalEvents();
        oThis.bindUserStateChangeEvents();
        oThis.bindPostRenderEvents();
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

        var radioBtn = $("input[name='userCreatorState']:checked");
        var radioValue = radioBtn.val();
        var user_id = +$(this).attr('data-user-id');
        var userFromRadioBtn = radioBtn.attr('data-user-id');

        if (userFromRadioBtn != user_id) {
          radioValue = null;
        }

        var updateButtonStatus = function() {
          $(button).html('Saved');
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

    bindPostRenderEvents: function() {
      const oThis = this;

      $('div#user-profile-img').click(function(event) {
        window.location = '/admin/user-profile/' + $(this).attr('data-user-id');
      });
    },

    approveUserAsCreator: function(user_id, successCallback) {
      const oThis = this;

      var token = $('meta[name="csrf-token"]').attr('content');

      $.ajax({
        url: oThis.approveUserAsCreatorUrl(user_id),
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

    blockUser: function(user_id, successCallback) {
      const oThis = this;

      var token = $('meta[name="csrf-token"]').attr('content');

      $.ajax({
        url: oThis.blockUserUrl(user_id),
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

    adminUserSearchUrl: function() {
      const oThis = this;

      return oThis.apiUrl + '/admin/users';
    },

    approveUserAsCreatorUrl: function(user_id) {
      const oThis = this;

      return oThis.apiUrl + '/admin/users/' + user_id + '/approve';
    },

    blockUserUrl: function(user_id) {
      const oThis = this;

      return oThis.apiUrl + '/admin/users/' + user_id + '/block';
    }
  };

  window.UserApproval = UserApproval;
})(window, jQuery);
