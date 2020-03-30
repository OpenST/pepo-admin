(function(window, $) {
  var Channel = function() {
    var oThis = this;

    oThis.config = {};

    oThis.apiUrl = $('meta[name="api-url"]').attr('content');

    oThis.createEditBtn = $('#create-edit-channel');
    oThis.imageUploadParams = {};
    oThis.imageNames = [];

    oThis.getPresignedPostUrl();

    oThis.bindEvents();
  };

  Channel.prototype = {
    bindEvents: function() {
      const oThis = this;

      // Generate report
      $(oThis.createEditBtn).click(function(event) {
        event.preventDefault();

        console.log('kya yeh kia....');

        $(oThis.createEditBtn).css('pointer-events', 'none');
        $(oThis.createEditBtn).html('Processing!...');
        $(oThis.createEditBtn).addClass('disabled');

        oThis.uploadImages();
      });
    },

    requestSuccessCallback: function() {
      const oThis = this;

      $(oThis.createEditBtn).css('pointer-events', 'auto');
      $(oThis.createEditBtn).html('Create / Edit');
      $(oThis.createEditBtn).removeClass('disabled');
    },

    requestFailureCallback: function() {
      const oThis = this;

      $(oThis.createEditBtn).css('pointer-events', 'auto');
      $(oThis.createEditBtn).html('Create / Edit');
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
              console.log('----------------imagesToUpload-------------------------------');
              console.log(imagesToUpload);

              for (let imageName in imagesToUpload) {
                oThis.imageNames.push(imageName);
                oThis.imageUploadParams[imageName] = oThis.imageUploadParams[imageName] || {};
                oThis.imageUploadParams[imageName]['post_url'] = imagesToUpload[imageName].post_url;
                oThis.imageUploadParams[imageName]['s3_url'] = imagesToUpload[imageName].s3_url;
                const post_fields = imagesToUpload[imageName].post_fields;

                for (let imu = 0; imu < post_fields.length; imu++) {
                  oThis.imageUploadParams[imageName]['post_fields'] =
                    oThis.imageUploadParams[imageName]['post_fields'] || {};
                  oThis.imageUploadParams[imageName]['post_fields'][post_fields[imu].key] = post_fields[imu].value;
                }
              }
            }

            console.log('----------------imageUploadParams-------------------------------');
            console.log(oThis.imageUploadParams);
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
        const uploadImageName = oThis.imageNames[0];
        originalFile.name = uploadImageName;

        $('#original_image_file_size').val(originalFileSize);
        $('#original_image_url').val(oThis.imageUploadParams[uploadImageName]['s3_url']);

        const imagePostUrl = oThis.imageUploadParams[uploadImageName]['post_url'];
        const imageUploadParams = oThis.imageUploadParams[uploadImageName]['post_fields'];

        imageUploadParams['file'] = originalFile;
        imageUploadParams['enctype'] = 'multipart/form-data';
        imageUploadParams['success_action_status'] = '200';

        // send ajax to api to create edit channel.
        $.ajax({
          url: imagePostUrl,
          type: 'POST',
          data: oThis.getFormData(imageUploadParams),
          encType: 'multipart/form-data',
          processData: false,
          contentType: false,
          cache: false,
          success: function(response) {
            console.log(response);
            oThis.uploadShareImage();
          },
          error: function(error) {
            console.error('===error', error);
          }
        });
      }
    },

    uploadShareImage: function() {
      const oThis = this;

      const shareImageFiles = document.getElementById('originalImage').files;

      if (shareImageFiles.length > 0) {
        const shareImageFile = shareImageFiles[0];
        const uploadImageName = oThis.imageNames[1];
        shareImageFile.name = uploadImageName;

        $('#share_image_file_size').val(shareImageFile.size);
        $('#share_image_url').val(oThis.imageUploadParams[uploadImageName]['s3_url']);

        const imagePostUrl = oThis.imageUploadParams[uploadImageName]['post_url'];
        const imageUploadParams = oThis.imageUploadParams[uploadImageName]['post_fields'];

        imageUploadParams['file'] = shareImageFile;
        imageUploadParams['enctype'] = 'multipart/form-data';
        imageUploadParams['success_action_status'] = '200';

        // send ajax to api to create edit channel.
        $.ajax({
          url: imagePostUrl,
          type: 'POST',
          data: oThis.getFormData(imageUploadParams),
          encType: 'multipart/form-data',
          processData: false,
          contentType: false,
          cache: false,
          success: function(response) {
            console.log(response);
            oThis.createEditChannel();
          },
          error: function(error) {
            console.error('===error', error);
          }
        });
      }
    },

    getFormData(paramsList) {
      let formData = new FormData();
      for (let key in paramsList) {
        formData.append(key, paramsList[key]);
      }
      return formData;
    },

    createEditChannel: function(successCallback, failureCallback) {
      var oThis = this;

      var data = $('#channel-form').serializeArray({});

      var postData = {};

      for (var i = 0; i < data.length; i++) {
        if (data[i].value) {
          postData[data[i].name] = data[i].value;
        }
      }

      // send ajax to api to create edit channel.
      $.ajax({
        url: oThis.apiUrl + '/admin/channel/edit',
        type: 'POST',
        data: JSON.stringify(postData),
        contentType: 'application/json',
        success: function(response) {
          if (response.data) {
            $('#requestSuccess').html('Request Successful.');
            $('#requestSuccess').show();
            oThis.requestSuccessCallback();
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
