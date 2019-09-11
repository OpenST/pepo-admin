(function(window, $) {
  const UserProfile = function(config) {
    const oThis = this;

    $.extend(oThis.config, config);
    oThis.bindEvents();

    oThis.lastPaginationId = null;
    oThis.query = null;

    oThis.apiUrl = $('meta[name="api-url"]').attr('content');
    oThis.csrfToken = $('meta[name="csrf-token"]').attr('content');

    oThis.userId = +window.location.pathname.split('user-profile/')[1];

    oThis.loadVideos(oThis.userId);
    oThis.loadBalance(oThis.userId);
  };

  UserProfile.prototype = {
    bindEvents: function() {
      const oThis = this;

      // Load next page
      $('#videos-load-btn').click(function(event) {
        event.preventDefault();

        var query = oThis.query;
        query = query + '&pagination_identifier=' + oThis.lastPaginationId;
        oThis.loadVideos(query);
      });
    },

    loadVideos: function(data) {
      const oThis = this;

      var status = localStorage.getItem('userStatus');

      if (status == 'INACTIVE') {
        $('#videos-load-btn').css('pointer-events', 'none');
        $('#videos-load-btn').html('Blocked user!');
        $('#videos-load-btn').addClass('disabled');
        return; // Don't load for blocked users
      }

      // Don't use success callback function directly. Think of oThis.
      $.ajax({
        url: oThis.videoHistoryUrl(oThis.userId),
        type: 'GET',
        data: data,
        contentType: 'application/json',
        success: function(response) {
          $('#videos-load-btn').removeClass('hidden');
          oThis.userSearchSuccessCallback(response);
          oThis.bindUserStateChangeEvents();
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

      var source = document.getElementById('video-detail-row').innerHTML;
      var videoRowTemplate = Handlebars.compile(source);

      if (response.data) {
        var searchResults = response.data[response.data.result_type];

        // Handle pagination
        var nextPageId = response.data.meta.next_page_payload
          ? response.data.meta.next_page_payload['pagination_identifier']
          : null;

        if (searchResults.length == 0) {
          $('#video-results').append('<br/><p class="text-danger">No result found.</p>');
        }

        oThis.lastPaginationId = nextPageId;

        if (!nextPageId) {
          $('#videos-load-btn').css('pointer-events', 'none');
          $('#videos-load-btn').html("That's all!");
          $('#videos-load-btn').addClass('disabled');
        } else {
          $('#videos-load-btn').css('pointer-events', 'auto');
          $('#videos-load-btn').html('Load more');
          $('#videos-load-btn').removeClass('disabled');
        }

        for (var ind = 0; ind < searchResults.length; ind++) {
          var videoId = searchResults[ind]['payload'].video_id;
          var userId = searchResults[ind]['payload'].user_id;
          var video = response.data['videos'][videoId];
          var posterImageId = video.poster_image_id;

          var videoLink = video.resolutions['720w'] ? video.resolutions['720w'].url : video.resolutions['original'].url;

          var videoData = response.data['video_details'][videoId];

          var imageLink = response.data['images'][posterImageId].resolutions['144w']
            ? response.data['images'][posterImageId].resolutions['144w'].url
            : response.data['images'][posterImageId].resolutions['original'].url;

          var context = {
            videoId: videoId,
            posterImageLink: imageLink,
            fanCount: videoData.total_contributed_by,
            pepoReceived: oThis.convertWeiToNormal(videoData.total_amount_raised_in_wei),
            videoLink: videoLink
          };

          var html = videoRowTemplate(context);

          $('#video-results').append(html);
        }

        oThis.bindVideoModalEvents();
        oThis.bindVideoStateChangeEvents();
      } else {
        console.error('===error', error);

        if (error.responseJSON.err.code == 'UNAUTHORIZED') {
          window.location = '/admin/unauthorized';
        }
      }
    },

    bindVideoStateChangeEvents: function() {
      const oThis = this;

      $('button#video-delete-btn').click(function(event) {
        const button = this;

        event.preventDefault();

        var videoId = +$(this).attr('data-video-id');

        var updateButtonStatus = function() {
          $(button).html('Saved');
          $(button).addClass('disabled');
          $(button).css('pointer-events', 'none');
        };

        oThis.deleteVideo(videoId, updateButtonStatus);
      });
    },

    bindVideoModalEvents: function() {
      const oThis = this;

      var videoSource = document.getElementById('video-tray').innerHTML;
      var videoTemplate = Handlebars.compile(videoSource);

      // Add listner for video thumbnail click
      $('tr td .video-thumbnail').click(function(event) {
        event.preventDefault();

        var videoLink = $(this).attr('data-video-link');

        console.log('====videoLink', videoLink);

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

    deleteVideo: function(video_id, successCallback) {
      const oThis = this;

      $.ajax({
        url: oThis.deleteVideoUrl(video_id),
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

    loadBalance: function(data) {
      const oThis = this;

      // Don't use success callback function directly. Think of oThis.
      $.ajax({
        url: oThis.balanceUrl(oThis.userId),
        type: 'GET',
        data: data,
        contentType: 'application/json',
        success: function(response) {
          oThis.replaceBalance(response);
        },
        error: function(error) {
          console.error('===error', error);

          if (error.responseJSON.err.code == 'UNAUTHORIZED') {
            window.location = '/admin/unauthorized';
          }
        }
      });
    },

    replaceBalance: function(response) {
      const oThis = this;

      var profileHeaderSource = document.getElementById('profile-header-template').innerHTML;
      var profileHeaderTemplate = Handlebars.compile(profileHeaderSource);

      var responseData = response.data[response.data.result_type];

      var name = localStorage.getItem('name');
      var userName = localStorage.getItem('userName');
      var imageLink = localStorage.getItem('imageLink');
      var isCreator = localStorage.getItem('creatorStatus');
      var status = localStorage.getItem('userStatus');

      imageLink = imageLink == 'null' ? null : imageLink;

      var headerContext = {
        name: name,
        userName: userName,
        userId: oThis.userId,
        imageLink: imageLink,
        balance: oThis.convertWeiToNormal(responseData.available_balance),
        isCreator: isCreator,
        status: status
      };

      var profileHeaderHtml = profileHeaderTemplate(headerContext);

      $('#profile-header').html(profileHeaderHtml);
    },

    bindUserStateChangeEvents: function() {
      const oThis = this;

      // Invoke admin action
      $('#admin-action').change(function(event) {
        event.preventDefault();

        const dropdown = $(this);

        var user_id = $(this).attr('data-user-id');

        var action = $(this)
          .children('option:selected')
          .val();

        var successCallback = function() {
          var dropdownText = action == 'approve' ? 'Approved' : 'Blocked';
          dropdown.children('option:selected').text(dropdownText);
        };

        if (action == 'approve') {
          oThis.approveUserAsCreator(user_id, successCallback);
        } else if (action == 'block') {
          oThis.blockUser(user_id, successCallback);
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

    blockUser: function(user_id, successCallback) {
      const oThis = this;

      $.ajax({
        url: oThis.blockUserUrl(user_id),
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

    convertWeiToNormal: function(value) {
      var divisor = new BigNumber(10).pow(18);
      return new BigNumber(value).div(divisor).toString(10);
    },

    balanceUrl: function(user_id) {
      const oThis = this;

      return oThis.apiUrl + '/admin/users/' + user_id + '/balance';
    },

    videoHistoryUrl: function(user_id) {
      const oThis = this;

      return oThis.apiUrl + '/admin/video-history/' + user_id;
    },

    deleteVideoUrl: function(video_id) {
      const oThis = this;

      return oThis.apiUrl + '/admin/delete-video/' + video_id;
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

  window.UserProfile = UserProfile;
})(window, jQuery);
