(function(window, $) {
  // //Add CSRF TOKEN
  $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
    if (options.url.indexOf('http') !== 0 || options.url.indexOf(window.location.origin) !== -1) {
      var csrf_token = $("meta[name='csrf-token']").attr('content');
      if (csrf_token) {
        jqXHR.setRequestHeader('X-CSRF-Token', csrf_token);
      }
    }
  });
})(window, jQuery);
