(function(window, $) {
  var UsageReports = function() {
    var oThis = this;

    oThis.config = {};

    oThis.apiUrl = $('meta[name="api-url"]').attr('content');

    $('#reports-link').addClass('active');
    $('#report-success').css('visibility', 'hidden');

    oThis.bindEvents();
  };

  UsageReports.prototype = {
    bindEvents: function() {
      var oThis = this;

      // Hide success message
      $('#usage-report').change(function(event) {
        event.preventDefault();

        if ($('#report-success').css('visibility') == 'visible') {
          $('#report-success').css('visibility', 'hidden');
        }
      });

      // Generate report
      $('#generate-report-btn').click(function(event) {
        event.preventDefault();

        var reportType = $('#usage-report')
          .children('option:selected')
          .val();

        if (reportType == 0) {
          return;
        }

        $(this).css('pointer-events', 'none');
        $(this).html('Generating!');
        $(this).addClass('disabled');

        var successCallback = function() {
          $('#generate-report-btn').css('pointer-events', 'auto');
          $('#generate-report-btn').html('Generate');
          $('#generate-report-btn').removeClass('disabled');

          // Toggle pill visibility
          oThis._toggleSuccessMessageVisibility();
        };

        oThis.generateReport(reportType, successCallback);
      });
    },

    generateReport: function(reportType, successCallback) {
      var oThis = this;

      var url = null;

      switch (reportType) {
        case 'user':
          url = oThis.userDataReportUrl();
          break;
        case 'video':
          url = oThis.videoPerformanceReportUrl();
          break;
        case 'tag':
          url = oThis.tagUsageReportUrl();
          break;
      }

      $.ajax({
        url: url,
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

          if (error.responseJSON.err.code == 'UNAUTHORIZED') {
            window.location = '/admin/unauthorized';
          }
        }
      });
    },

    _toggleSuccessMessageVisibility: function() {
      if ($('#report-success').css('visibility') == 'hidden') {
        $('#report-success').css('visibility', 'visible');
      } else {
        $('#report-success').css('visibility', 'hidden');
      }
    },

    userDataReportUrl: function() {
      var oThis = this;
      return oThis.apiUrl + '/admin/update-usage-data/user-data';
    },

    videoPerformanceReportUrl: function() {
      var oThis = this;
      return oThis.apiUrl + '/admin/update-usage-data/videos-performance';
    },

    tagUsageReportUrl: function() {
      var oThis = this;
      return oThis.apiUrl + '/admin/update-usage-data/tags-used';
    }
  };

  window.UsageReports = UsageReports;
})(window, jQuery);
