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

      // Don't use success callback function directly. Think of oThis.
      $.ajax({
        url: oThis.videoHistoryUrl(oThis.userId),
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
          var posterImageId = response.data['videos'][videoId].poster_image_id;

          var videoData = response.data['video_details'][videoId];

          var imageLink = response.data['images'][posterImageId].resolutions['144w']
            ? response.data['images'][posterImageId].resolutions['144w'].url
            : response.data['images'][posterImageId].resolutions['original'].url;

          // TODO - match keys
          var context = {
            videoId: videoId,
            posterImageLink: imageLink,
            fanCount: videoData.total_contributed_by,
            pepoReceived: videoData.total_amount_raised_in_wei
          };

          var html = videoRowTemplate(context);

          $('#video-results').append(html);
        }

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

    videoHistoryUrl: function(user_id) {
      const oThis = this;

      return oThis.apiUrl + '/admin/video-history/' + user_id;
    },

    deleteVideoUrl: function(video_id) {
      const oThis = this;

      return oThis.apiUrl + '/admin/delete-video/' + video_id;
    }
  };

  window.UserProfile = UserProfile;
})(window, jQuery);
