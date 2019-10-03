(function(window, $) {
  const UserApproval = function(config) {
    const oThis = this;

    oThis.config = {};

    $.extend(oThis.config, config);
    oThis.bindEvents();
    oThis.bindSortAndFilterEvents();

    oThis.lastPaginationId = null;
    oThis.query = null;

    oThis.apiUrl = $('meta[name="api-url"]').attr('content');
    oThis.csrfToken = $('meta[name="csrf-token"]').attr('content');

    oThis.toggleLoadMoreVisibility();
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

        var query = oThis.prepareQuery();

        if (query != '') {
          query = oThis.query + query;
        } else {
          query = oThis.query;
        }

        oThis.toggleLoadMoreVisibility();
        oThis.toggleLoaderVisibility();
        oThis.loadUsers(query);
      });

      // Load next page
      $('#load-btn').click(function(event) {
        event.preventDefault();

        var query = oThis.prepareQuery();

        if (query != '') {
          query = oThis.query + query;
        } else {
          query = oThis.query;
        }

        query = query + '&pagination_identifier=' + oThis.lastPaginationId;

        oThis.toggleLoadMoreVisibility();
        oThis.toggleLoaderVisibility();
        oThis.loadUsers(query);
      });
    },

    toggleLoadMoreVisibility: function() {
      if ($('#load-btn').css('visibility') == 'hidden') {
        $('#load-btn').css('visibility', 'visible');
      } else {
        $('#load-btn').css('visibility', 'hidden');
      }
    },

    toggleLoaderVisibility: function() {
      const oThis = this;

      if ($('.loader').css('visibility') == 'hidden') {
        $('.loader').css('visibility', 'visible');
      } else {
        $('.loader').css('visibility', 'hidden');
      }
    },

    bindSortAndFilterEvents: function() {
      const oThis = this;

      // Apply sort
      $('#signed-up-user-sort').change(function(event) {
        event.preventDefault();

        oThis.applyFilterOrSort();
      });

      // Apply filter
      $('#signed-up-user-filter').change(function(event) {
        event.preventDefault();

        oThis.applyFilterOrSort();
      });
    },

    prepareQuery: function() {
      const oThis = this;

      var sortBy = $('#signed-up-user-sort')
        .children('option:selected')
        .val();

      var filterBy = $('#signed-up-user-filter')
        .children('option:selected')
        .val();

      var query = '';

      if (sortBy != 0) {
        query = query + '&sort_by=' + sortBy;
      }

      if (filterBy != 0) {
        query = query + '&filter=' + filterBy;
      }

      return query;
    },

    applyFilterOrSort: function() {
      const oThis = this;

      var query = oThis.prepareQuery();

      if (query != '') {
        query = oThis.query + query;
      } else {
        query = oThis.query;
      }

      $('#user-search-results').html('');
      oThis.toggleLoadMoreVisibility();
      oThis.toggleLoaderVisibility();
      oThis.loadUsers(query);
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
          oThis.toggleLoaderVisibility();
          oThis.toggleLoadMoreVisibility();
        },
        error: function(error) {
          console.error('===error', error);

          oThis.toggleLoadMoreVisibility();

          if (error.responseJSON.err.code == 'UNAUTHORIZED') {
            window.location = '/admin/unauthorized';
          }
        }
      });
    },

    userSearchSuccessCallback: function(response) {
      const oThis = this;

      var source = document.getElementById('user-row').innerHTML;
      var userRowTemplate = Handlebars.compile(source);

      if (response.data) {
        var searchResults = response.data[response.data.result_type];

        if (searchResults.length == 0) {
          $('#user-search-results').append(
            '<br/><p class="text-danger" style="margin-left: 25%;">No result found.</p>'
          );

          $('#load-btn').css('pointer-events', 'none');
          $('#load-btn').html("That's all!");
          $('#load-btn').addClass('disabled');
          return;
        }

        var ubtAddress = response.data['token'].utility_branded_token;
        var chainId = response.data['token'].aux_chain_id;

        // Handle pagination
        var nextPageId = response.data.meta.next_page_payload
          ? response.data.meta.next_page_payload['pagination_identifier']
          : null;

        oThis.lastPaginationId = nextPageId;

        if (!nextPageId) {
          $('#load-btn').css('pointer-events', 'none');
          $('#load-btn').html("That's all!");
          $('#load-btn').addClass('disabled');
        } else {
          $('#load-btn').css('pointer-events', 'auto');
          $('#load-btn').html('Load more');
          $('#load-btn').removeClass('disabled');
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

          // Get social link
          var socialLink = '';
          if (!response.data['links'][link_id]) {
            // Nothing to do
          } else {
            socialLink = response.data['links'][link_id].url;
          }

          var userStats = response.data['user_stats'][userId];
          var pepoCoins = response.data['user_pepo_coins_map'][userId];
          var inviteCodes = response.data['invite_codes'][userId];

          var twitterUser = response.data['twitter_users'][userId],
            handle = twitterUser['handle'],
            email = userData['email'],
            viewLink = null;

          if (!email) {
            email = twitterUser['email'];
          }

          if (ubtAddress && chainId && userData.ost_token_holder_address) {
            viewLink =
              oThis.config.viewBaseUrl +
              '/token/th-' +
              chainId +
              '-' +
              ubtAddress +
              '-' +
              userData.ost_token_holder_address;
          }

          var twitterLink = null;

          if (handle) {
            twitterLink = 'https://twitter.com/' + handle;
          }

          var amountRaised = userStats.total_amount_raised_in_wei
            ? oThis.convertWeiToNormal(userStats.total_amount_raised_in_wei)
            : '0';
          var amountSpent = userStats.total_amount_spent_in_wei
            ? oThis.convertWeiToNormal(userStats.total_amount_spent_in_wei)
            : '0';

          userStats['total_amount_raised'] = amountRaised;
          userStats['total_amount_spent'] = amountSpent;

          var referralCount = inviteCodes && inviteCodes.invited_user_count ? inviteCodes.invited_user_count : '0';

          var approvedCreator = userData.properties.includes('IS_APPROVED_CREATOR');
          var deniedApproval = userData.properties.includes('IS_DENIED_CREATOR');

          var context = {
            userId: userId,
            name: userData.name,
            userName: userData.user_name,
            status: userData.status,
            videoLink: videoLink,
            socialLink: socialLink,
            imageLink: imageLink,
            userStats: userStats,
            pepoCoins: pepoCoins,
            userViewLink: viewLink,
            twitterLink: twitterLink,
            userEmail: email,
            createdAt: new Date(userData.created_at * 1000).toLocaleString(),
            referralCount: referralCount,
            tokenHolder: userData.ost_token_holder_address,
            isCreator: approvedCreator,
            isDeniedApproval: deniedApproval
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

      var lastValue = null;

      // Invoke admin action
      $('.admin-action')
        .focus(function() {
          lastValue = $(this).val();
        })
        .change(function(event) {
          event.preventDefault();

          const dropdown = $(this);

          var user_id = $(this).attr('data-user-id');

          var action = $(this)
            .children('option:selected')
            .val();

          var successCallback = function() {
            var dropdownText = null;

            switch (action) {
              case 'approve':
                dropdownText = 'Approved';
                break;
              case 'block':
                dropdownText = 'Blocked';
                break;
              case 'deny':
                dropdownText = 'Not Eligible';
            }

            dropdown.children('option:selected').text(dropdownText);
          };

          var resp = confirm('Are you sure?');

          if (!resp) {
            dropdown.val(lastValue);
            return;
          }

          if (action == 'approve') {
            oThis.approveUserAsCreator(user_id, successCallback);
          } else if (action == 'block') {
            oThis.blockUser(user_id, successCallback);
          } else if (action == 'deny') {
            oThis.denyUser(user_id, successCallback);
          }
        });
    },

    bindPostRenderEvents: function() {
      const oThis = this;

      $('div#user-profile-img').click(function(event) {
        var userId = $(this).attr('data-user-id');
        window.location = '/admin/user-profile/' + userId;
      });

      $('.email-copy').click(function(event) {
        event.preventDefault();
        var userEmail = $(this).attr('data-user-email');

        var textArea = document.createElement('textarea');

        textArea.value = userEmail;

        document.body.appendChild(textArea);
        textArea.select();

        document.execCommand('copy');
        document.body.removeChild(textArea);
      });

      $('[data-toggle="tooltip"]').tooltip();
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

    denyUser: function(user_id, successCallback) {
      const oThis = this;

      $.ajax({
        url: oThis.denyUserUrl(user_id),
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
      var eth = new BigNumber(10).pow(18);
      var thousand = new BigNumber(10).pow(3);

      var normalValueBn = new BigNumber(value).div(eth);

      if (normalValueBn.gt(thousand)) {
        normalValueBn =
          normalValueBn
            .div(thousand)
            .decimalPlaces(2)
            .toString(10) + ' K';
        return normalValueBn;
      }

      return normalValueBn.decimalPlaces(2).toString(10);
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
    },

    denyUserUrl: function(user_id) {
      const oThis = this;

      return oThis.apiUrl + '/admin/users/' + user_id + '/deny';
    }
  };

  window.UserApproval = UserApproval;
})(window, jQuery);
