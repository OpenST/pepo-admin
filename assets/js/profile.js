(function(window, $) {
  var UserProfile = function() {
    var oThis = this;

    oThis.config = {};

    $.extend(oThis.config);
    oThis.bindEvents();
    oThis.lastPaginationId = null;
    oThis.query = null;
    oThis.videoDescription = null;
    oThis.videoId = null;
    oThis.videoDetails = {};
    oThis.linkDetails = {};
    oThis.apiUrl = $('meta[name="api-url"]').attr('content');
    oThis.csrfToken = $('meta[name="csrf-token"]').attr('content');
    oThis.userId = +window.location.pathname.split('user-profile/')[1];
    oThis.loadVideos(oThis.userId);
    oThis.loadProfile(oThis.userId);
    oThis.autoCompleteInitialized = false;
    oThis.saveDescCheck = false;
    oThis.saveLinkCheck = false;
  };

  UserProfile.prototype = {
    bindEvents: function() {
      var oThis = this;

      // Load next page
      $('#videos-load-btn').click(function(event) {
        event.preventDefault();

        var query = oThis.query;
        query = query + '&pagination_identifier=' + oThis.lastPaginationId;
        oThis.loadVideos(query);
      });

      // Load next page
      $('#reply-tab').click(function(event) {
        event.preventDefault();

        $('#profile-tab-list .nav-item span').removeClass('active');
        $('#reply-tab span').addClass('active');
        $('#video-list').css('display', 'none');
        $('#reply-list').css('display', 'block');
      });

      // Load next page
      $('#video-tab').click(function(event) {
        event.preventDefault();

        $('#profile-tab-list .nav-item span').removeClass('active');
        $('#video-tab span').addClass('active');
        $('#video-list').css('display', 'block');
        $('#reply-list').css('display', 'none');
      });
    },
    onMuteUnmuteBtnClick: function() {
      var oThis = this;
      oThis.jErrorBox = $('.mute-unmute-error');
      oThis.jErrorBox.text('');
      oThis.jMuteUnmuteBtn = $('#mute-unmute-btn');
      oThis.jMuteUnmuteBtn.attr('disabled', true);
      if (oThis.onSuccessUserStatus == 1) {
        oThis.changeStatusApiUrl = oThis.apiUrl + '/admin/users/' + oThis.userId + '/unmute';
        oThis.className = 'btn-outline-danger';
        oThis.onSuccessUserStatus = 0;
        oThis.btnText = 'Mute';
      } else {
        oThis.changeStatusApiUrl = oThis.apiUrl + '/admin/users/' + oThis.userId + '/mute';
        oThis.className = 'btn-danger';
        oThis.onSuccessUserStatus = 1;
        oThis.btnText = 'Unmute';
      }
      $.ajax({
        url: oThis.changeStatusApiUrl,
        headers: {
          'csrf-token': oThis.csrfToken
        },
        type: 'POST',
        success: function(res) {
          oThis.jMuteUnmuteBtn.attr('disabled', false);
          if (res && res.success) {
            oThis.jMuteUnmuteBtn.text(oThis.btnText);
            oThis.jMuteUnmuteBtn.removeClass('btn-outline-danger btn-danger').addClass(oThis.className);
          } else {
            var errorMsg = res && res.err && res.err.error_data && res.err.error_data[0].msg;
            oThis.jErrorBox.text(errorMsg);
          }
        },
        error: function(err) {
          oThis.jMuteUnmuteBtn.attr('disabled', false);
          var errorMsg = err && err.responseJSON && err.responseJSON.err && err.responseJSON.err.msg;
          oThis.jErrorBox.text(errorMsg);
        }
      });
    },
    loadVideos: function(data, videoId) {
      var oThis = this;

      // Don't use success callback function directly. Think of oThis.
      $.ajax({
        url: oThis.videoHistoryUrl(oThis.userId),
        type: 'GET',
        data: data,
        contentType: 'application/json',
        success: function(response) {
          $('#videos-load-btn').removeClass('hidden');
          oThis.videoHistorySuccessCallback(response);
          if (oThis.saveLinkCheck || oThis.saveDescCheck) {
            oThis.updateVideoModal(response, videoId);
          }
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

    videoHistorySuccessCallback: function(response) {
      var oThis = this;

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

        oThis.videoDescriptions = response.data['video_descriptions'];
        oThis.videoDetails = response.data['video_details'];
        oThis.linkDetails = response.data['links'];
        var html;
        for (var ind = 0; ind < searchResults.length; ind++) {
          var videoId = searchResults[ind]['payload'].video_id;
          var video = response.data['videos'][videoId];
          var posterImageId = video.poster_image_id;

          var videoLink = video.resolutions['720w'] ? video.resolutions['720w'].url : video.resolutions['original'].url;

          var videoData = response.data['video_details'][videoId];

          var imageLink = null,
            descriptionId = null,
            description = '',
            replyCount = 0,
            replyCountStyle = '',
            repliesUrl = '';

          if (posterImageId) {
            imageLink = response.data['images'][posterImageId].resolutions['144w']
              ? response.data['images'][posterImageId].resolutions['144w'].url
              : response.data['images'][posterImageId].resolutions['original'].url;
          }

          descriptionId = videoData.description_id;
          if (descriptionId) {
            description = oThis.videoDescriptions[descriptionId].text;
          }
          replyCount = videoData.total_replies ? videoData.total_replies : 'No';
          replyCountStyle = videoData.total_replies ? 'reply-col-style' : null;
          repliesUrl = '/admin/video-replies/?videoId=' + videoId + '&userId=' + oThis.userId;

          var context = {
            videoId: videoId,
            posterImageLink: imageLink,
            updatedAt: new Date(video.uts * 1000).toLocaleString(),
            fanCount: videoData.total_contributed_by,
            pepoReceived: oThis.convertWeiToNormal(videoData.total_amount_raised_in_wei),
            videoLink: videoLink,
            descriptionId: descriptionId,
            description: description,
            replyCount: replyCount,
            replyCountStyle: replyCountStyle,
            repliesUrl: repliesUrl
          };

          html += videoRowTemplate(context);
        }
        if (html) {
          $('#video-results').empty();
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

    updateVideoModal: function(response, videoId) {
      var oThis = this;
      var videoData = response.data['video_details'];
      if (oThis.saveDescCheck) {
        var descriptionId = videoData[videoId].description_id;
        var videoDescriptions = response.data['video_descriptions'];
        var newDescription = videoDescriptions[descriptionId] && videoDescriptions[descriptionId].text;
        oThis.onDescriptionSaveSuccess(newDescription);
      }

      if (oThis.saveLinkCheck) {
        var linkId = videoData[videoId] && videoData[videoId].link_ids && videoData[videoId].link_ids[0];
        var linksData = response.data['links'];
        var newLink = linksData[linkId] && linksData[linkId].url;
        oThis.onLinkSaveSuccess(newLink);
      }
    },

    bindVideoStateChangeEvents: function() {
      var oThis = this;

      $('button#video-delete-btn').click(function(event) {
        var button = this;

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
      var oThis = this;

      var videoSource = document.getElementById('video-tray').innerHTML;
      var videoTemplate = Handlebars.compile(videoSource);

      // Add listner for video thumbnail click
      $('tr td .video-thumbnail').click(function(event) {
        event.preventDefault();

        var videoLink = $(this).attr('data-video-link');
        var videoId = +$(this).attr('data-video-id');
        var descriptionId = +$(this).attr('data-desc-id');
        var description = null;
        oThis.videoId = videoId;

        if (descriptionId) {
          description = oThis.videoDescriptions[descriptionId].text;
        }

        var links = oThis.videoDetails[videoId].link_ids;

        var descriptionLink = links && links.length > 0 ? oThis.linkDetails[links[0]].url : null;

        descriptionLink = oThis.linkFormatting(descriptionLink);
        $('#modal-container').html(
          videoTemplate({
            videoLink: videoLink,
            description: description,
            descriptionLink: descriptionLink
          })
        );

        $('.modal').modal('show');
        $('#edit-video-desc').on('click', function() {
          oThis.onVideoDescEdit();
        });
        $('#edit-video-desc-link').on('click', function() {
          oThis.onVideoDescLinkEdit();
        });
        $('#cancel-video-description').on('click', function() {
          oThis.onVideoDescCancel();
        });
        $('#cancel-video-description-link').on('click', function() {
          oThis.onVideoDescLinkCancel();
        });
        $('#save-video-description').on('click', function() {
          oThis.onVideoDescSave();
        });
        $('#save-video-description-link').on('click', function() {
          oThis.onLinkSave();
        });

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
      var oThis = this;

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

    loadProfile: function(data) {
      var oThis = this;

      // Don't use success callback function directly. Think of oThis.
      $.ajax({
        url: oThis.profileUrl(oThis.userId),
        type: 'GET',
        data: data,
        contentType: 'application/json',
        success: function(response) {
          oThis.updateProfile(response);
          oThis.bindUserStateChangeEvents();
        },
        error: function(error) {
          console.error('===error', error);

          if (error.responseJSON.err.code == 'UNAUTHORIZED') {
            window.location = '/admin/unauthorized';
          }
        }
      });
    },

    updateProfile: function(response) {
      var oThis = this;

      var profileHeaderSource = document.getElementById('profile-header-template').innerHTML;
      var profileHeaderTemplate = Handlebars.compile(profileHeaderSource);
      var responseData = response.data;
      var userData = responseData['users'][oThis.userId];
      var imageData = responseData['images'];
      var profile_image_id = userData.profile_image_id;
      var imageLink = null;
      if (profile_image_id) {
        imageLink = imageData[profile_image_id].resolutions['144w']
          ? imageData[profile_image_id].resolutions['144w'].url
          : imageData[profile_image_id].resolutions['original'].url;
      }
      var isCreator = userData.approved_creator ? true : false;
      var status = userData.status;
      var balanceInUsd = oThis.convertWeiToNormal(responseData.user_balance.balance_usd);
      var totalBalanceInUsd = new BigNumber(balanceInUsd)
        .plus(new BigNumber(responseData.user_balance.balance_pepocorn))
        .toString();
      var muteStatusInt = responseData.global_user_mute_details[oThis.userId].all,
        className = null,
        btnText = null;
      oThis.onSuccessUserStatus = muteStatusInt;
      if (muteStatusInt) {
        className = 'btn-danger';
        btnText = 'Unmute';
      } else {
        className = 'btn-outline-danger';
        btnText = 'Mute';
      }

      var headerContext = {
        name: userData.name,
        userName: userData.user_name,
        userId: oThis.userId,
        imageLink: imageLink,
        balanceInUsd: balanceInUsd,
        balanceInPepo: oThis.convertWeiToNormalWithoutRounding(responseData.user_balance.balance_pepo),
        pepocornBalance: responseData.user_balance.balance_pepocorn,
        totalBalanceInUsd: totalBalanceInUsd,
        isCreator: isCreator,
        status: status,
        className: className,
        btnText: btnText
      };

      var profileHeaderHtml = profileHeaderTemplate(headerContext);

      $('#profile-header').html(profileHeaderHtml);
      $('#mute-unmute-btn').on('click', function() {
        oThis.onMuteUnmuteBtnClick();
      });
    },

    bindUserStateChangeEvents: function() {
      var oThis = this;

      // Invoke admin action
      $('#admin-action').change(function(event) {
        event.preventDefault();

        var dropdown = $(this);

        var user_id = $(this).attr('data-user-id');

        var action = $(this)
          .children('option:selected')
          .val();

        var successCallback = function() {
          var dropdownText = action == 'approve' ? 'Approved' : 'Deleted';
          dropdown.children('option:selected').text(dropdownText);
        };

        if (action == 'approve') {
          oThis.approveUserAsCreator(user_id, successCallback);
        } else if (action == 'delete') {
          oThis.deleteUser(user_id, successCallback);
        }
      });
    },

    approveUserAsCreator: function(user_id, successCallback) {
      var oThis = this;

      var resp = confirm('Are you sure you want to approve user as creator?');

      if (!resp) {
        return;
      }

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

    deleteUser: function(user_id, successCallback) {
      var oThis = this;

      var resp = confirm('Are you sure you want to delete the user?');

      if (!resp) {
        return;
      }

      $.ajax({
        url: oThis.deleteUserUrl(user_id),
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
      return new BigNumber(value)
        .div(divisor)
        .toFixed(2)
        .toString(10);
    },

    convertWeiToNormalWithoutRounding: function(value) {
      var divisor = new BigNumber(10).pow(18);
      return new BigNumber(value).div(divisor).toString(10);
    },

    profileUrl: function(user_id) {
      var oThis = this;

      return oThis.apiUrl + '/admin/users/' + user_id + '/profile';
    },

    videoHistoryUrl: function(user_id) {
      var oThis = this;

      return oThis.apiUrl + '/admin/video-history/' + user_id;
    },

    deleteVideoUrl: function(video_id) {
      var oThis = this;

      return oThis.apiUrl + '/admin/delete-video/' + video_id;
    },

    approveUserAsCreatorUrl: function(user_id) {
      var oThis = this;

      return oThis.apiUrl + '/admin/users/' + user_id + '/approve';
    },

    deleteUserUrl: function(user_id) {
      var oThis = this;

      return oThis.apiUrl + '/admin/users/' + user_id + '/delete';
    },

    onVideoDescEdit: function() {
      var oThis = this;
      var oldDesc = $('#bio_text').text();
      $('#edit-video-description').val(oldDesc);
      $('.video_desc').hide();
      $('.video_desc_editable').show();
      if (!oThis.autoCompleteInitialized) {
        oThis.initializeAutoComplete();
      }
    },

    onVideoDescLinkEdit: function() {
      var oldDescLink = $('#link_url').text();
      $('#edit-video-description-link').val(oldDescLink);
      $('.video_desc_link').hide();
      $('.video_desc_link_editable').show();
    },

    onVideoDescCancel: function() {
      $('.video_desc_editable .inline-error').empty();
      $('.video_desc_editable').hide();
      $('.video_desc').show();
    },

    onVideoDescLinkCancel: function() {
      $('.video_desc_link_editable .inline-error').empty();
      $('.video_desc_link_editable').hide();
      $('.video_desc_link').show();
    },

    onVideoDescSave: function() {
      var oThis = this;
      oThis.saveDescCheck = true;
      oThis.saveDescription();
    },

    onLinkSave: function() {
      var oThis = this;
      oThis.saveLinkCheck = true;
      oThis.saveLink();
    },

    initializeAutoComplete: function() {
      var oThis = this;
      oThis.autoCompleteInitialized = true;
      $('#edit-video-description').jqueryautocompleteplus({
        trigger2: '#',
        trigger1: '#',
        outputTrigger2: true,
        outputTrigger1: true,
        minLength1: 3,
        minLength2: 3,
        onInputChange: oThis.onInputChange,
        dataModifier: oThis.modifyData
      });
    },

    modifyData: function(resData) {
      var newData = [];
      for (var i = 0; i < resData.length; i++) {
        newData.push({
          value: resData[i].text,
          label: resData[i].text
        });
      }
      return newData;
    },

    onInputChange: function(query, paginationIdTags, dataModifier, callBack) {
      var oThis = this;
      var ajaxUrl = null,
        response;
      if (paginationIdTags == null) {
        ajaxUrl = '/api/admin/tags?q=' + query;
      } else {
        ajaxUrl = '/api/admin/tags?q=' + query + '&pagination_identifier=' + encodeURIComponent(paginationIdTags);
      }

      $.ajax({
        url: ajaxUrl,
        type: 'GET',
        success: function(res) {
          if (res.success) {
            console.log('res', res);
            var formatedData = dataModifier(res.data.tags);
            var paginationIdTags =
              res.data.meta.next_page_payload && res.data.meta.next_page_payload.pagination_identifier;
            response = {
              formatedData: formatedData,
              paginationIdTags: paginationIdTags
            };
            callBack(response);
          }
        },
        error: function(err) {
          console.log('err', err);
        }
      });
    },

    onDescriptionSaveSuccess: function(newDescription) {
      var oThis = this;
      $('.video_desc_editable .inline-error').empty();
      $('.video_desc_editable').hide();
      $('.video_desc').show();
      $('#bio_text').empty();
      $('#bio_text').html(newDescription);
      // oThis.loadVideos(oThis.userId);
      oThis.saveDescCheck = false;
    },

    onDescriptionSaveError: function(errorMsg) {
      $('.video_desc_editable .inline-error').text(errorMsg);
    },

    onLinkSaveSuccess: function(newLink) {
      var oThis = this;
      // oThis.loadVideos(oThis.userId);
      $('.video_desc_link_editable .inline-error').empty();
      $('.video_desc_link_editable').hide();
      $('.video_desc_link').show();
      newLink = oThis.linkFormatting(newLink);
      $('#link_url').empty();
      $('#link_url').html(newLink);
      $('#link_url').attr('href', newLink);
      oThis.saveLinkCheck = false;
    },

    linkFormatting: function(url) {
      if (url) {
        url = url.toLowerCase();
      }
      if (url && !(url.startsWith('http://', 0) || url.startsWith('https://', 0))) {
        url = 'http://' + url;
      }
      return url;
    },

    onLinkSaveError: function(errorMsg) {
      $('.video_desc_link_editable .inline-error').text(errorMsg);
    },

    saveDescription: function() {
      var oThis = this;
      var newDescription = $('#edit-video-description').val();
      var ajaxUrl = oThis.apiUrl + '/admin/update-video/' + oThis.videoId + '/description';
      $.ajax({
        url: ajaxUrl,
        type: 'POST',
        data: JSON.stringify({
          video_description: newDescription
        }),
        contentType: 'application/json',
        headers: {
          'csrf-token': oThis.csrfToken
        },
        success: function(res) {
          if (res.success) {
            oThis.loadVideos(oThis.userId, oThis.videoId);
          } else {
            console.log('====error====', res);
            var errorMsg = res.err.error_data[0].msg;
            oThis.onDescriptionSaveError(errorMsg);
          }
        },
        error: function(err) {
          console.log('====error====', err);
          var errorMsg = err.responseJSON.err.msg;
          oThis.onDescriptionSaveError(errorMsg);
        }
      });
    },

    saveLink: function() {
      var oThis = this;
      var newLink = $('#edit-video-description-link').val();
      newLink = oThis.linkFormatting(newLink);
      var ajaxUrl = oThis.apiUrl + '/admin/update-video/' + oThis.videoId + '/link';
      $.ajax({
        url: ajaxUrl,
        type: 'POST',
        data: JSON.stringify({
          link: newLink
        }),
        contentType: 'application/json',
        headers: {
          'csrf-token': oThis.csrfToken
        },
        success: function(res) {
          if (res.success) {
            oThis.loadVideos(oThis.userId, oThis.videoId);
          } else {
            console.log('====error====', res);
            var errorMsg = res.err.error_data[0].msg;
            oThis.onLinkSaveError(errorMsg);
          }
        },
        error: function(err) {
          console.log('====error====', err);
          var errorMsg = err.responseJSON.err.msg;
          oThis.onLinkSaveError(errorMsg);
        }
      });
    }
  };

  window.UserProfile = UserProfile;
})(window, jQuery);
