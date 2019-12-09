(function(window, $) {
  const VideoReply = function() {
    const oThis = this;

    oThis.config = {};

    $.extend(oThis.config);
    oThis.bindEvents();
    oThis.lastPaginationId = null;
    oThis.videoDescription = null;
    oThis.videoDetails = {};
    oThis.linkDetails = {};
    oThis.apiUrl = $('meta[name="api-url"]').attr('content');
    oThis.csrfToken = $('meta[name="csrf-token"]').attr('content');
    oThis.autoCompleteInitialized = false;
    oThis.saveDescCheck = false;
    oThis.saveLinkCheck = false;
    oThis.originalVideoUpdated = false;
    var params = new URL(document.location).searchParams;
    oThis.userId = params.get('userId');
    oThis.videoId = params.get('videoId');
    oThis.query = oThis.videoId;
    var replyParams = {
      video_id: oThis.videoId
    };
    oThis.loadReplies(replyParams); // get replies data
    oThis.loadProfile();
  };

  VideoReply.prototype = {
    bindEvents: function() {
      const oThis = this;
      // Load next page
      $('#replies-load-btn').click(function(event) {
        event.preventDefault();
        var query = null;
        // query = query + '&pagination_identifier=' + oThis.lastPaginationId;
        query = {
          video_id: oThis.query,
          pagination_identifier: oThis.lastPaginationId
        };
        oThis.loadReplies(query);
      });
    },
    loadParentVideoDetails: function(parentId) {
      var oThis = this;
      $.ajax({
        url: oThis.getVideoDetails(parentId),
        type: 'GET',
        headers: {
          'csrf-token': oThis.csrfToken
        },
        success: function(res) {
          if (res) {
            if (res.success) {
              oThis.updateParentVideo(res);
            } else {
              console.log('===error', error);
            }
          }
        },
        error: function(err) {
          console.log('===error');
        }
      });
    },
    updateParentVideo: function(response) {
      var oThis = this,
        originalVideoSource = document.getElementById('original-video-template').innerHTML,
        originalVideoTemplate = Handlebars.compile(originalVideoSource),
        originalVideoHtml = null,
        responseData = response.data,
        videosData = responseData.videos,
        videoPosterImageId = videosData[oThis.videoId].poster_image_id,
        video = videosData[oThis.videoId],
        videoDetails = responseData.video_details[oThis.videoId];

      if (videoPosterImageId) {
        oThis.videoPosterImage = response.data['images'][videoPosterImageId].resolutions['144w']
          ? response.data['images'][videoPosterImageId].resolutions['144w'].url
          : response.data['images'][videoPosterImageId].resolutions['original'].url;
      }
      oThis.videoLinkParent = video.resolutions['720w']
        ? video.resolutions['720w'].url
        : video.resolutions['original'].url;
      oThis.descriptionIdParent = videoDetails.description_id;
      oThis.videoDetailsParent = videoDetails;
      oThis.linkDetailsParent = responseData.links;
      oThis.videoDescriptionsParent = responseData.video_descriptions;
      var context = {
        videoLink: oThis.videoLinkParent,
        videoId: oThis.videoId,
        descriptionId: oThis.descriptionIdParent,
        videoPosterImage: oThis.videoPosterImage
      };

      originalVideoHtml = originalVideoTemplate(context);
      $('#original-video').html(originalVideoHtml);
      oThis.bindOriginalVideoModalEvents();
    },

    loadProfile: function() {
      const oThis = this;

      // Don't use success callback function directly. Think of oThis.
      $.ajax({
        url: oThis.profileUrl(oThis.userId),
        type: 'GET',
        contentType: 'application/json',
        success: function(response) {
          if (response) {
            if (response.success) {
              oThis.updateProfile(response);
            } else {
              console.log('==error', error);
            }
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
      var oThis = this,
        profileHeaderSource = document.getElementById('reply-profile-header-template').innerHTML,
        profileHeaderTemplate = Handlebars.compile(profileHeaderSource),
        responseData = response.data,
        userData = responseData['users'][oThis.userId],
        imageData = responseData['images'],
        profile_image_id = userData.profile_image_id,
        imageLink = null;

      if (profile_image_id) {
        imageLink = imageData[profile_image_id].resolutions['144w']
          ? imageData[profile_image_id].resolutions['144w'].url
          : imageData[profile_image_id].resolutions['original'].url;
      }
      oThis.profileImageLink = imageLink;
      oThis.userName = userData.user_name;
      oThis.name = userData.name;
      var headerContext = {
          name: userData.name,
          userName: userData.user_name,
          userId: oThis.userId,
          imageLink: imageLink,
          descriptionId: oThis.descriptionIdParent,
          videoId: oThis.videoId,
          videoLink: oThis.videoLinkParent,
          videoPosterImage: oThis.videoPosterImage
        },
        profileHeaderHtml = profileHeaderTemplate(headerContext);

      $('#profile-header-replies').html(profileHeaderHtml);
    },

    loadReplies: function(data, replyDetailId) {
      const oThis = this;

      // Don't use success callback function directly. Think of oThis.
      $.ajax({
        url: oThis.listReplyUrl(),
        type: 'GET',
        data: data,
        contentType: 'application/json',
        headers: {
          'csrf-token': oThis.csrfToken
        },
        success: function(response) {
          $('#replies-load-btn').removeClass('hidden');
          oThis.listRepliesSuccessCallback(response);
          var parentId = oThis.getParentId(response);
          oThis.loadParentVideoDetails(parentId);
          if (oThis.saveLinkCheck || oThis.saveDescCheck) {
            oThis.updateVideoModal(response, replyDetailId);
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
    getParentId: function(response) {
      var responseData = response.data[response.data.result_type],
        resplyDetailId =
          responseData && responseData[0] && responseData[0].payload && responseData[0].payload.reply_detail_id,
        parentId = response.data.reply_details[resplyDetailId].parent_id;
      return parentId;
    },

    listRepliesSuccessCallback: function(response) {
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
          $('#reply-results').append('<br/><p class="text-danger">No results.</p>');
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
        oThis.users = response.data['users'];
        var html;
        for (var ind = 0; ind < searchResults.length; ind++) {
          var replyDetailId = searchResults[ind]['payload'].reply_detail_id,
            videoId = response.data.reply_details[replyDetailId].entity_id,
            video = response.data['videos'][videoId],
            posterImageId = video.poster_image_id,
            videoLink = video.resolutions['576w'] ? video.resolutions['576w'].url : video.resolutions['original'].url,
            replyDetail = response.data['reply_details'][replyDetailId],
            imageLink = null,
            descriptionId = null,
            description = null,
            replyBy = null,
            replyById = null,
            userProfileLink = null;

          if (posterImageId) {
            imageLink = response.data['images'][posterImageId].resolutions['144w']
              ? response.data['images'][posterImageId].resolutions['144w'].url
              : response.data['images'][posterImageId].resolutions['original'].url;
          }

          var replyCreatorId = replyDetail.creator_user_id;
          replyBy = oThis.users[replyCreatorId].user_name;
          replyById = oThis.users[replyCreatorId].id;
          descriptionId = replyDetail.description_id;
          if (descriptionId) {
            description = oThis.videoDescriptions[descriptionId].text;
          }
          userProfileLink = '/admin/user-profile/' + replyById;

          var context = {
            videoId: videoId,
            replyDetailId: replyDetailId,
            posterImageLink: imageLink,
            updatedAt: new Date(video.uts * 1000).toLocaleString(),
            fanCount: replyDetail.total_contributed_by,
            pepoReceived: oThis.convertWeiToNormal(replyDetail.total_amount_raised_in_wei),
            replyLink: videoLink,
            descriptionId: descriptionId,
            description: description,
            replyBy: replyBy,
            userProfileLink: userProfileLink
          };

          html += videoRowTemplate(context);
        }
        if (html) {
          // $('#reply-results').empty();
          $('#reply-results').append(html);
        }

        oThis.bindVideoModalEvents();
        oThis.bindVideoStateChangeEvents();
      } else {
        console.log('===error');
        if (error.responseJSON.err.code == 'UNAUTHORIZED') {
          window.location = '/admin/unauthorized';
        }
      }
    },

    updateVideoModal: function(response, id) {
      const oThis = this;
      var replyData = null;
      if (oThis.originalVideoUpdated) {
        replyData = response.data['video_details'];
      } else {
        replyData = response.data['reply_details'];
      }
      if (oThis.saveDescCheck) {
        var descriptionId = replyData && replyData[id] && replyData[id].description_id;
        var videoDescriptions = response.data['video_descriptions'];
        var newDescription = videoDescriptions[descriptionId] && videoDescriptions[descriptionId].text;
        oThis.onDescriptionSaveSuccess(newDescription);
      }

      if (oThis.saveLinkCheck) {
        var linkId = replyData[id] && replyData[id].link_ids && replyData[id].link_ids[0];
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
    bindOriginalVideoModalEvents: function() {
      const oThis = this;

      var videoSource = document.getElementById('video-tray').innerHTML;
      var videoTemplate = Handlebars.compile(videoSource);

      // Add listner for video thumbnail click
      $('div.video-thumbnail').click(function(event) {
        event.preventDefault();
        oThis.originalVideoUpdated = true;
        var videoLink = $(this).attr('data-video-link');
        var videoId = +$(this).attr('data-video-id');
        var descriptionId = +$(this).attr('data-desc-id');
        var description = null;

        oThis.videoIdToSave = videoId;
        if (descriptionId) {
          description = oThis.videoDescriptionsParent[descriptionId].text;
        }

        var links = oThis.videoDetailsParent.link_ids;

        var descriptionLink = links && links.length > 0 ? oThis.linkDetailsParent[links[0]].url : null;

        descriptionLink = oThis.linkFormatting(descriptionLink);
        $('#modal-container-replies').html(
          videoTemplate({
            videoLink: videoLink,
            description: description,
            descriptionLink: descriptionLink
          })
        );

        oThis.bindModalEvents();
      });
    },

    bindModalEvents: function() {
      var oThis = this;
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
      $('#modal-container-replies').on('hidden.bs.modal', function(event) {
        $('.modal-backdrop').remove();
        $('#modal-container-replies').html('');
      });
    },

    bindVideoModalEvents: function() {
      const oThis = this;
      oThis.originalVideoUpdated = false;
      var videoSource = document.getElementById('video-tray').innerHTML;
      var videoTemplate = Handlebars.compile(videoSource);

      // Add listner for video thumbnail click
      $('tr td .video-thumbnail-reply').click(function(event) {
        event.preventDefault();

        var videoLink = $(this).attr('data-video-link');
        var replyDetailId = +$(this).attr('data-reply-detail-id');
        var descriptionId = +$(this).attr('data-desc-id');
        var description = null;

        oThis.videoIdToSave = replyDetailId;

        if (descriptionId) {
          description = oThis.videoDescriptions[descriptionId].text;
        }

        var links = oThis.replyDetails[replyDetailId].link_ids;

        var descriptionLink = links && links.length > 0 ? oThis.linkDetails[links[0]].url : null;

        descriptionLink = oThis.linkFormatting(descriptionLink);
        $('#modal-container-replies').html(
          videoTemplate({
            videoLink: videoLink,
            description: description,
            descriptionLink: descriptionLink
          })
        );
        oThis.bindModalEvents();
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
    listReplyUrl: function() {
      var oThis = this;
      return oThis.apiUrl + '/admin/videos/' + oThis.videoId + '/replies';
    },
    replyHistoryUrl: function(user_id) {
      const oThis = this;

      return oThis.apiUrl + '/admin/reply-history/' + user_id;
    },

    deleteReplyUrl: function(reply_detail_id) {
      const oThis = this;

      return oThis.apiUrl + '/admin/delete-reply-video/' + reply_detail_id;
    },
    profileUrl: function(user_id) {
      var oThis = this;
      return oThis.apiUrl + '/admin/users/' + user_id + '/profile';
    },
    getVideoDetails: function(video_id) {
      var oThis = this;
      return oThis.apiUrl + '/admin/videos/' + video_id;
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
        var checkerUrl = url.toLowerCase();
        if (checkerUrl && !(checkerUrl.startsWith('http://', 0) || checkerUrl.startsWith('https://', 0))) {
          url = 'http://' + url;
        }
      }
      return url;
    },
    onLinkSaveError: function(errorMsg) {
      $('.video_desc_link_editable .inline-error').text(errorMsg);
    },

    saveDescription: function() {
      const oThis = this;
      var newDescription = $('#edit-video-description').val(),
        ajaxUrl = null;
      if (oThis.originalVideoUpdated) {
        var ajaxUrl = oThis.apiUrl + '/admin/update-video/' + oThis.videoIdToSave + '/description';
      } else {
        ajaxUrl = oThis.apiUrl + '/admin/update-reply-video/' + oThis.videoIdToSave + '/description';
      }

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
            if (!oThis.originalVideoUpdated) {
              oThis.loadReplies(oThis.userId, oThis.videoIdToSave);
            } else {
              oThis.onDescriptionSaveSuccess(newDescription);
              oThis.originalVideoUpdated = false;
            }
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
      var ajaxUrl = null;
      newLink = oThis.linkFormatting(newLink);
      if (oThis.originalVideoUpdated) {
        ajaxUrl = oThis.apiUrl + '/admin/update-video/' + oThis.videoIdToSave + '/link';
      } else {
        ajaxUrl = oThis.apiUrl + '/admin/update-reply-video/' + oThis.videoIdToSave + '/link';
      }

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
            if (!oThis.originalVideoUpdated) {
              oThis.loadReplies(oThis.userId, oThis.videoIdToSave);
            } else {
              oThis.onLinkSaveSuccess(newLink);
              oThis.originalVideoUpdated = false;
            }
          } else {
            console.log('====error====', res);
            var errorMsg = res && res.err && res.err.error_data && res.err.error_data[0] && res.err.error_data[0].msg;
            oThis.onLinkSaveError(errorMsg);
          }
        },
        error: function(err) {
          console.log('====error====', err);
          var errorMsg = err && err.responseJSON && err.responseJSON.err && err.responseJSON.err.msg;
          oThis.onLinkSaveError(errorMsg);
        }
      });
    }
  };

  window.VideoReply = VideoReply;
})(window, jQuery);
