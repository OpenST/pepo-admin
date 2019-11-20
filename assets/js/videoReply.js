(function(window, $) {
  const VideoReply = function() {
    const oThis = this;

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
    oThis.loadReplies(oThis.userId);

    oThis.autoCompleteInitialized = false;
    oThis.saveDescCheck = false;
    oThis.saveLinkCheck = false;
  };

  VideoReply.prototype = {
    bindEvents: function() {
      const oThis = this;

      // Load next page
      $('#replies-load-btn').click(function(event) {
        event.preventDefault();

        var query = oThis.query;
        query = query + '&pagination_identifier=' + oThis.lastPaginationId;
        oThis.loadReplies(query);
      });
    },

    loadReplies: function(data, videoId) {
      const oThis = this;

      // Don't use success callback function directly. Think of oThis.
      $.ajax({
        url: oThis.replyHistoryUrl(oThis.userId),
        type: 'GET',
        data: data,
        contentType: 'application/json',
        success: function(response) {
          $('#replies-load-btn').removeClass('hidden');
          oThis.videoHistorySuccessCallback(response);
          if (oThis.saveLinkCheck || oThis.saveDescCheck) {
            oThis.updateVideoModal(response, videoId);
          }
        },
        error: function(error) {
          console.error('===error', error);

          $('#replies-load-btn').addClass('hidden');
          if (error.responseJSON.err.code == 'UNAUTHORIZED') {
            window.location = '/admin/unauthorized';
          }
        }
      });
    },

    videoHistorySuccessCallback: function(response) {
      const oThis = this;

      var source = document.getElementById('reply-detail-row').innerHTML;
      var videoRowTemplate = Handlebars.compile(source);

      if (response.data) {
        var searchResults = response.data[response.data.result_type];

        // Handle pagination
        var nextPageId = response.data.meta.next_page_payload
          ? response.data.meta.next_page_payload['pagination_identifier']
          : null;

        if (searchResults.length == 0) {
          $('#reply-results').html('');
          $('#reply-results').append('<br/><p class="text-danger">No result found.</p>');
        }

        oThis.lastPaginationId = nextPageId;

        if (!nextPageId) {
          $('#replies-load-btn').css('pointer-events', 'none');
          $('#replies-load-btn').html("That's all!");
          $('#replies-load-btn').addClass('disabled');
        } else {
          $('#replies-load-btn').css('pointer-events', 'auto');
          $('#replies-load-btn').html('Load more');
          $('#replies-load-btn').removeClass('disabled');
        }

        oThis.videoDescriptions = response.data['video_descriptions'];
        oThis.videoDetails = response.data['video_details'];
        oThis.replyDetails = response.data['reply_details'];
        oThis.linkDetails = response.data['links'];
        var html;
        for (var ind = 0; ind < searchResults.length; ind++) {
          var replyDetailId = searchResults[ind]['payload'].reply_detail_id;
          var videoId = searchResults[ind]['payload'].video_id;
          var video = response.data['videos'][videoId];
          var posterImageId = video.poster_image_id;

          var videoLink = video.resolutions['576w'] ? video.resolutions['576w'].url : video.resolutions['original'].url;

          var replyDetail = response.data['reply_details'][replyDetailId];

          var imageLink = null;
          var descriptionId = null;

          if (posterImageId) {
            imageLink = response.data['images'][posterImageId].resolutions['144w']
              ? response.data['images'][posterImageId].resolutions['144w'].url
              : response.data['images'][posterImageId].resolutions['original'].url;
          }

          descriptionId = replyDetail.description_id;

          var context = {
            videoId: videoId,
            replyDetailId: replyDetailId,
            posterImageLink: imageLink,
            updatedAt: new Date(video.uts * 1000).toLocaleString(),
            fanCount: replyDetail.total_contributed_by,
            pepoReceived: oThis.convertWeiToNormal(replyDetail.total_amount_raised_in_wei),
            replyLink: videoLink,
            descriptionId: descriptionId
          };

          html += videoRowTemplate(context);
        }
        if (html) {
          $('#reply-results').empty();
          $('#reply-results').append(html);
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
      const oThis = this;
      var videoData = response.data['video_details'];
      if (oThis.saveDescCheck) {
        var descriptionId = videoData[videoId].description_id;
        var videoDescriptions = response.data['video_descriptions'];
        var newDescription = videoDescriptions[descriptionId] && videoDescriptions[descriptionId].text;
        oThis.onDescriptionSaveSuccess(newDescription);
      }

      if (oThis.saveLinkCheck) {
        var linkId = videoData[videoId].link_ids[0];
        var linksData = response.data['links'];
        var newLink = linksData[linkId] && linksData[linkId].url;
        oThis.onLinkSaveSuccess(newLink);
      }
    },

    bindVideoStateChangeEvents: function() {
      const oThis = this;

      $('button#reply-delete-btn').click(function(event) {
        const button = this;

        event.preventDefault();

        var replyDetailId = +$(this).attr('data-reply-detail-id');

        var updateButtonStatus = function() {
          $(button).html('Saved');
          $(button).addClass('disabled');
          $(button).css('pointer-events', 'none');
        };

        oThis.deleteReply(replyDetailId, updateButtonStatus);
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
        var videoId = +$(this).attr('data-video-id');
        var replyDetailId = +$(this).attr('data-reply-detail-id');
        var descriptionId = +$(this).attr('data-desc-id');
        var description = null;
        oThis.videoId = videoId;

        if (descriptionId) {
          description = oThis.videoDescriptions[descriptionId].text;
        }

        var links = oThis.replyDetails[replyDetailId].link_ids;

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

    deleteReply: function(reply_detail_id, successCallback) {
      const oThis = this;

      $.ajax({
        url: oThis.deleteReplyUrl(reply_detail_id),
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

    updateProfile: function(response) {
      const oThis = this;

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
        status: status
      };

      var profileHeaderHtml = profileHeaderTemplate(headerContext);

      $('#profile-header').html(profileHeaderHtml);
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

    replyHistoryUrl: function(user_id) {
      const oThis = this;

      return oThis.apiUrl + '/admin/reply-history/' + user_id;
    },

    deleteReplyUrl: function(reply_detail_id) {
      const oThis = this;

      return oThis.apiUrl + '/admin/delete-reply-video/' + reply_detail_id;
    },

    onVideoDescEdit: function() {
      const oThis = this;
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
      const oThis = this;
      oThis.saveDescCheck = true;
      oThis.saveDescription();
    },
    onLinkSave: function() {
      const oThis = this;
      oThis.saveLinkCheck = true;
      oThis.saveLink();
    },
    initializeAutoComplete: function() {
      const oThis = this;
      oThis.autoCompleteInitialized = true;
      $('#edit-video-description').jqueryautocompleteplus({
        trigger2: '#',
        outputTrigger2: true,
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
      const oThis = this;
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
      const oThis = this;
      $('.video_desc_editable .inline-error').empty();
      $('.video_desc_editable').hide();
      $('.video_desc').show();
      $('#bio_text').empty();
      $('#bio_text').html(newDescription);
      // oThis.loadReplies(oThis.userId);
      oThis.saveDescCheck = false;
    },
    onDescriptionSaveError: function(errorMsg) {
      $('.video_desc_editable .inline-error').text(errorMsg);
    },
    onLinkSaveSuccess: function(newLink) {
      const oThis = this;
      // oThis.loadReplies(oThis.userId);
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
      const oThis = this;
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
            oThis.loadReplies(oThis.userId, oThis.videoId);
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
      const oThis = this;
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
            oThis.loadReplies(oThis.userId, oThis.videoId);
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

  window.VideoReply = VideoReply;
})(window, jQuery);
