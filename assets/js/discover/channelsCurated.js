(function(window, $) {
  const ChannelsCurated = function(config) {
    BaseClass.call(this);
    const oThis = this;
    $.extend(oThis, config);
    oThis.jChannelAddBtn = $('#add-channel-btn');
    oThis.jListWrapper = $('#channels-list');
    oThis.jListTemplate = $('#discover-channel-list-item-template');
    oThis.jErrorBox = $('#tags-list-tab #error-box');
    oThis.searchInput = $('#searchChannelInput');
    oThis.deleteSelector = '.delete-entry';
    oThis.MAX_LIMIT_MSG = 'Can only add upto 20 Channel.';
    oThis.entityKind = 'channels';
    oThis.config = {
      url: '/admin/curated-entities/channels',
      callback: oThis.initializeTemplateData
    };
    oThis.totalEntries = null;
    oThis.bindEvents();
    oThis.bindEventsParent();
    oThis.getInitialData();
    oThis.initSortable();
  };

  ChannelsCurated.prototype = {
    onDeleteSuccess: function(res) {
      var oThis = this;
      if (res && res.success) {
        oThis.getData();
      } else {
        console.log('** Error :: onDeleteSuccess **');
        oThis.jErrorBox.text(oThis.getSpecificError(res));
      }
    },
    onDeleteError: function(err) {
      var oThis = this;
      console.log('** Error :: onDeleteError **');
      oThis.jErrorBox.text(oThis.getGeneralError(err));
    },
    onInputChange: function(request, response) {
      var oThis = this;
      $.ajax({
        url: oThis.apiUrl + '/admin/channels?q=' + request.term,
        type: 'GET',
        success: function(res) {
          console.log('res success');

          var channelsData = res.data.channels,
            formattedChannelsData = [];
          if (channelsData) {
            oThis.jErrorBox.text('');
            formattedChannelsData = oThis.formatChannelsdata(channelsData);
          } else {
            oThis.jErrorBox.text('No results');
          }
          response(formattedChannelsData);
        },
        error: function(err) {
          console.log('res error');
        }
      });
    },
    formatChannelsdata: function(channelsData) {
      var oThis = this,
        formattedChannelsData = [];
      oThis.channelsIds = Object.keys(channelsData);
      for (var i = 0; i < oThis.channelsIds.length; i++) {
        formattedChannelsData[i] = {
          id: channelsData[oThis.channelsIds[i]].id,
          label: channelsData[oThis.channelsIds[i]].name,
          value: channelsData[oThis.channelsIds[i]].name
        };
      }

      return formattedChannelsData;
    },
    getInitialData: function() {
      var oThis = this;
      oThis.getData();
    },
    onSuccess: function(res) {
      var oThis = this;
      if (res && res.success) {
        oThis.emptyErrorBox();
        oThis.initializeTemplateData(res.data);
      }
    },
    initializeTemplateData: function(res) {
      var oThis = this;
      var source = document.getElementById('discover-channel-list-item-template').innerHTML,
        listRowTemplate = Handlebars.compile(source),
        resultType = res.result_type,
        searchResultType = res[resultType] || [],
        listRowTemplateHtml = '',
        listData = null;
      oThis.listData = res.channels || {};
      oThis.searchResultType = searchResultType;

      for (var i = 0; i < searchResultType.length; i++) {
        listData = oThis.getChannelRowData(searchResultType[i].entityId, res.channels);
        listRowTemplateHtml += listRowTemplate(listData);
      }
      oThis.jListWrapper.empty();
      oThis.jListWrapper.html(listRowTemplateHtml);
    },
    getChannelRowData: function(ListItemId, data) {
      var templateData = {
        id: ListItemId,
        entryLabel: data[ListItemId].name
      };
      return templateData;
    },
    bindEvents: function() {
      const oThis = this;
      oThis.jChannelAddBtn.on('click', function() {
        oThis.addEntry();
      });
    }
  };

  ChannelsCurated.prototype = Object.assign(Object.create(BaseClass.prototype), ChannelsCurated.prototype);
  ChannelsCurated.prototype.constructor = ChannelsCurated;

  window.ChannelsCurated = ChannelsCurated;
})(window, jQuery);
