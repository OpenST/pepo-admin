(function(window, $) {
  var Channel = function() {
    var oThis = this;

    oThis.config = {};

    oThis.apiUrl = $('meta[name="api-url"]').attr('content');
    $('#channel-link').addClass('active');

    oThis.createEditBtn = $('#create-edit-channel');
    oThis.imageUploadParams = {};
    oThis.imageNames = { original: '' };

    oThis.getPresignedPostUrl();

    oThis.bindEvents();
  };

  Channel.prototype = {
    bindEvents: function() {
      const oThis = this;

      $('input:radio[name="is_edit"]').change(function() {
        $('.inputRow').removeClass('fieldError');
        if ($(this).attr('id') == 'createBtn') {
          $('#createMessage').show();
          $('#editMessage').hide();
        } else {
          $('#createMessage').hide();
          $('#editMessage').show();
        }
      });

      $('input').focus(function() {
        $('.inputRow').removeClass('fieldError');
      });

      // Generate report
      $(oThis.createEditBtn).click(function(event) {
        event.preventDefault();

        $(oThis.createEditBtn).css('pointer-events', 'none');
        $(oThis.createEditBtn).html('Processing!...');
        $(oThis.createEditBtn).addClass('disabled');
        $('.inputRow').removeClass('fieldError');

        $('#requestError').hide();
        $('#requestSuccess').hide();

        oThis.uploadImages();
      });
    },

    requestSuccessCallback: function() {
      const oThis = this;

      $(oThis.createEditBtn).css('pointer-events', 'auto');
      $(oThis.createEditBtn).html('Submit');
      $(oThis.createEditBtn).removeClass('disabled');
    },

    requestFailureCallback: function() {
      const oThis = this;

      $(oThis.createEditBtn).css('pointer-events', 'auto');
      $(oThis.createEditBtn).html('Submit');
      $(oThis.createEditBtn).removeClass('disabled');
    },

    getPresignedPostUrl: function() {
      var oThis = this;

      $.ajax({
        url: oThis.apiUrl + '/admin/channel/presigned-url',
        type: 'GET',
        contentType: 'application/json',
        success: function(response) {
          if (response.data) {
            console.log(response.data);

            if (response.data.channel_upload_params && response.data.channel_upload_params.images) {
              const imagesToUpload = response.data.channel_upload_params.images;

              for (var imageName in imagesToUpload) {
                if (imageName.indexOf('share') >= 0) {
                  oThis.imageNames['share'] = imageName;
                } else {
                  oThis.imageNames['original'] = imageName;
                }

                oThis.imageUploadParams[imageName] = oThis.imageUploadParams[imageName] || {};
                oThis.imageUploadParams[imageName]['post_url'] = imagesToUpload[imageName].post_url;
                oThis.imageUploadParams[imageName]['s3_url'] = imagesToUpload[imageName].s3_url.replace('.jpeg', '');
                const post_fields = imagesToUpload[imageName].post_fields;

                for (var imu = 0; imu < post_fields.length; imu++) {
                  oThis.imageUploadParams[imageName]['post_fields'] =
                    oThis.imageUploadParams[imageName]['post_fields'] || {};
                  oThis.imageUploadParams[imageName]['post_fields'][post_fields[imu].key] = post_fields[imu].value;
                }
              }
            }
          } else {
            console.error('=======Unknown response====.serialize', response);
          }
        },
        error: function(error) {
          console.error('===error', error);
        }
      });
    },

    uploadImages: function() {
      const oThis = this;

      const originalFiles = document.getElementById('originalImage').files;

      if (originalFiles.length > 0) {
        const originalFile = originalFiles[0];
        const originalFileSize = originalFile.size;
        const uploadImageName = oThis.imageNames['original'];
        originalFile.name = uploadImageName;

        $('#cover_image_file_size').val(originalFileSize);
        $('#cover_image_url').val(oThis.imageUploadParams[uploadImageName]['s3_url']);

        const imagePostUrl = oThis.imageUploadParams[uploadImageName]['post_url'];
        const imageUploadParams = oThis.imageUploadParams[uploadImageName]['post_fields'];

        imageUploadParams['file'] = originalFile;
        imageUploadParams['enctype'] = 'multipart/form-data';
        imageUploadParams['success_action_status'] = '201';

        // send ajax to api to create edit channel.
        $.ajax({
          url: imagePostUrl,
          type: 'POST',
          data: window.getFormData(imageUploadParams),
          processData: false,
          contentType: false,
          cache: false,
          success: function(response) {
            console.log(response);
            oThis.createEditChannel();
          },
          error: function(error) {
            console.error('===error', error);
            if ($(error.responseText).find('Code')[0].innerText == 'EntityTooLarge') {
              $('#requestError').html('Uploaded Image is larger than required.');
              $('#requestError').show();
            }
            oThis.requestFailureCallback();
          }
        });
      } else {
        oThis.createEditChannel();
      }
    },

    createEditChannel: function(successCallback, failureCallback) {
      var oThis = this,
        data = $('#channel-form').serializeArray({}),
        postData = {};

      for (var i = 0; i < data.length; i++) {
        if (data[i].value) {
          postData[data[i].name] = data[i].value;
        }
      }

      var mandatoryFieldsMap = {
        create: [
          'permalink',
          'channel_name',
          'channel_tagline',
          'channel_description',
          'channel_tags',
          'channel_admins',
          'cover_image_url'
        ],
        edit: ['permalink']
      };

      var mandatoryFields = postData['is_edit'] == '1' ? mandatoryFieldsMap['edit'] : mandatoryFieldsMap['create'],
        errorFound = false;

      for (var mf = 0; mf < mandatoryFields.length; mf++) {
        var fieldName = mandatoryFields[mf];
        if (!postData[fieldName]) {
          $("[name='" + fieldName + "']")
            .closest('.inputRow')
            .addClass('fieldError');
          errorFound = true;
        }
      }
      if (errorFound) {
        $('#requestError').html('Please Fill all mandatory fields.');
        $('#requestError').show();
        oThis.requestFailureCallback();
        return;
      }

      // send ajax to api to create edit channel.
      $.ajax({
        url: oThis.apiUrl + '/admin/channel/edit',
        type: 'POST',
        data: JSON.stringify(postData),
        contentType: 'application/json',
        success: function(response) {
          if (response.data) {
            $('#requestSuccess').html('Request Successful. Please refresh page for next request.');
            $('#requestSuccess').show();
            oThis.requestSuccessCallback();
            setTimeout(function() {
              window.location = window.location;
            }, 5000);
          } else {
            $('#requestError').html(JSON.stringify(response.err));
            $('#requestError').show();
            oThis.requestFailureCallback();
            console.error('=======Unknown response====', response);
          }
        },
        error: function(error) {
          console.error('===error', error);
          $('#requestError').html('Request Failed.');
          $('#requestError').show();

          oThis.requestFailureCallback();
          if (error.responseJSON.err.code == 'UNAUTHORIZED') {
            window.location = '/admin/unauthorized';
          }
        }
      });
    }
  };

  window.Channel = Channel;
})(window, jQuery);
