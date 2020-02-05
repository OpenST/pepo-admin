(function(window, $) {
  const TagsCurated = function(config) {
    BaseClass.call(this);
    const oThis = this;
    $.extend(oThis, config);
    oThis.jTagsAddBtn = $('#add-tags-btn');
    oThis.jListWrapper = $('#tags-list');
    oThis.jListTemplate = $('#discover-tag-list-item-template');
    oThis.PeopleListData = null;
    oThis.jErrorBox = $('#tags-list-tab #error-box');
    oThis.searchInput = $('#searchTagInput');
    oThis.deleteSelector = '.delete-entry';
    oThis.MAX_LIMIT_MSG = 'Can only add upto 20 Tags.';
    oThis.entityKind = 'tags';
    oThis.config = {
      url: '/admin/curated-entities/tags',
      callback: oThis.initializeTemplateData
    };
    oThis.totalEntries = null;
    oThis.bindEvents();
    oThis.bindEventsParent();
    oThis.getInitialData();
    oThis.initSortable();
  };

  TagsCurated.prototype = {
    onInputChange: function(request, response) {
      var oThis = this;
      $.ajax({
        url: oThis.apiUrl + '/admin/tags?q=' + request.term,
        type: 'GET',
        success: function(res) {
          console.log('res success');

          var tagsdata = res.data.tags,
            formattedTagsData = [];
          if (tagsdata) {
            oThis.jErrorBox.text('');
            formattedTagsData = oThis.formatTagsdata(tagsdata);
          } else {
            oThis.jErrorBox.text('No results');
          }
          response(formattedTagsData);
        },
        error: function(err) {
          console.log('res error');
        }
      });
    },
    formatTagsdata: function(tagsdata) {
      var oThis = this,
        formattedTagsData = [];
      oThis.tagIds = Object.keys(tagsdata);
      for (var i = 0; i < oThis.tagIds.length; i++) {
        formattedTagsData[i] = {
          id: tagsdata[oThis.tagIds[i]].id,
          label: tagsdata[oThis.tagIds[i]].text,
          value: tagsdata[oThis.tagIds[i]].text
        };
      }

      return formattedTagsData;
    },
    initializeTemplateData: function(res) {
      var oThis = this;
      var source = document.getElementById('discover-tag-list-item-template').innerHTML,
        listRowTemplate = Handlebars.compile(source),
        resultType = res.result_type,
        searchResultType = res[resultType] || [],
        listRowTemplateHtml = '',
        listData = null;
      oThis.listData = res.tags || {};
      oThis.searchResultType = searchResultType;

      for (var i = 0; i < searchResultType.length; i++) {
        listData = oThis.getTagRowData(searchResultType[i].entityId, res.tags);
        listRowTemplateHtml += listRowTemplate(listData);
      }
      oThis.jListWrapper.empty();
      oThis.jListWrapper.html(listRowTemplateHtml);
    },
    getTagRowData: function(ListItemId, data) {
      var templateData = {
        id: ListItemId,
        entryLabel: data[ListItemId].text
      };
      return templateData;
    },
    bindEvents: function() {
      const oThis = this;
      oThis.jTagsAddBtn.on('click', function() {
        oThis.addEntry();
      });
    }
  };

  TagsCurated.prototype = Object.assign(Object.create(BaseClass.prototype), TagsCurated.prototype);
  TagsCurated.prototype.constructor = TagsCurated;

  window.TagsCurated = TagsCurated;
})(window, jQuery);
