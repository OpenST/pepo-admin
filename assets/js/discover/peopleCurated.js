(function(window, $) {
  const PeopleCurated = function(config) {
    BaseClass.call(this);
    const oThis = this;
    $.extend(oThis, config);
    oThis.jPeopleAddBtn = $('#add-people-btn');
    oThis.jListWrapper = $('#people-list');
    oThis.jListTemplate = $('#discover-people-list-item-template');
    oThis.jErrorBox = $('#people-list-tab #error-box');
    oThis.searchInput = $('#searchPeopleInput');
    oThis.deleteSelector = '.delete-entry';
    oThis.MAX_LIMIT_MSG = 'Can only add upto 20 people.';
    oThis.entityKind = 'users';
    oThis.config = {
      url: '/admin/curated-entities/users',
      callback: oThis.initializeTemplateData
    };
    oThis.totalEntries = null;
    oThis.bindEvents();
    oThis.bindEventsParent();

    oThis.getInitialData();
    oThis.initSortable();
  };

  PeopleCurated.prototype = {
    onInputChange: function(request, response) {
      var oThis = this;
      $.ajax({
        url: oThis.apiUrl + '/admin/users?q=' + request.term,
        type: 'GET',
        success: function(res) {
          console.log('res success');

          var usersData = res.data.users,
            formattedUsersData = [];
          if (usersData) {
            oThis.jErrorBox.text('');
            formattedUsersData = oThis.formatPeopledata(usersData);
          } else {
            oThis.jErrorBox.text('No results');
          }
          response(formattedUsersData);
        },
        error: function(err) {
          console.log('res error');
        }
      });
    },
    formatPeopledata: function(usersData) {
      var oThis = this,
        formattedUsersData = [];
      oThis.userIds = Object.keys(usersData);
      for (var i = 0; i < oThis.userIds.length; i++) {
        var userId = usersData[oThis.userIds[i]].id,
          label = usersData[oThis.userIds[i]].user_name,
          value = usersData[oThis.userIds[i]].user_name;
        formattedUsersData[i] = {
          id: usersData[oThis.userIds[i]].id,
          label: usersData[oThis.userIds[i]].user_name,
          value: usersData[oThis.userIds[i]].user_name
        };
      }

      return formattedUsersData;
    },
    initializeTemplateData: function(res) {
      var oThis = this;
      var source = document.getElementById('discover-people-list-item-template').innerHTML,
        listRowTemplate = Handlebars.compile(source),
        resultType = res.result_type,
        searchResultType = res[resultType] || [],
        listRowTemplateHtml = '',
        listData = null;
      oThis.listData = res.users || {};
      oThis.searchResultType = searchResultType;

      for (var i = 0; i < searchResultType.length; i++) {
        listData = oThis.getPeopleRowData(searchResultType[i].entityId, res.users);
        listRowTemplateHtml += listRowTemplate(listData);
      }
      oThis.jListWrapper.empty();
      oThis.jListWrapper.html(listRowTemplateHtml);
    },
    getPeopleRowData: function(ListItemId, data) {
      var templateData = {
        id: ListItemId,
        entryLabel: data[ListItemId].user_name
      };
      return templateData;
    },
    bindEvents: function() {
      const oThis = this;
      oThis.jPeopleAddBtn.on('click', function() {
        oThis.addEntry();
      });
    }
  };

  PeopleCurated.prototype = Object.assign(Object.create(BaseClass.prototype), PeopleCurated.prototype);
  PeopleCurated.prototype.constructor = PeopleCurated;

  window.PeopleCurated = PeopleCurated;
})(window, jQuery);
