(function(window, $) {
  const Discover = function() {
    const oThis = this;
    oThis.config = {};
    oThis.MaxAllowedEntries = 20;
    oThis.apiUrl = $('meta[name="api-url"]').attr('content');
    oThis.csrfToken = $('meta[name="csrf-token"]').attr('content');
    oThis.jPeopleAddBtn = $('#add-people-btn');
    oThis.jListTemplate = $('#discover-list-item-template');
    oThis.jPeopleListWrapper = $('#people-list');
    oThis.jTagsListWrapper = $('#tags-list');
    oThis.PeopleListData = null;
    oThis.TagListData = null;
    oThis.jErrorBox = $('#people-list-tab #error-box');
    oThis.jErrorBoxTags = $('#tags-list-tab #error-box');
    oThis.jAddTagsBtn = $('#add-tags-btn');
    oThis.peopleSearchInput = $('#searchPeopleInput');
    oThis.tagSearchInput = $('#searchTagInput');
    oThis.maxLimitMsg = 'Can only add upto 20 people.';
    oThis.bindEvents();
    oThis.getinitialPeopleData = oThis.getinitialPeopleData.bind(oThis);
    oThis.initializeUsersTemplate = oThis.initializeUsersTemplate.bind(oThis);
    oThis.getinitialTagsData = oThis.getinitialTagsData.bind(oThis);
    oThis.initializeTagsTemplate = oThis.initializeTagsTemplate.bind(oThis);
    oThis.getinitialPeopleData();
    oThis.getinitialTagsData();
  };

  Discover.prototype = {
    bindEvents: function() {
      const oThis = this;
      oThis.jPeopleAddBtn.on('click', function() {
        if (oThis.totalEntriesPeople >= oThis.MaxAllowedEntries) {
          oThis.jErrorBox.text(oThis.maxLimitMsg);
        } else {
          oThis.onAddBtnClick('users', oThis.entity_id_people, oThis.getinitialPeopleData);
        }
      });
      oThis.jAddTagsBtn.on('click', function() {
        if (oThis.totalEntriesTags >= oThis.MaxAllowedEntries) {
          oThis.jErrorBoxTags.text(oThis.maxLimitMsg);
        } else {
          oThis.onAddBtnClick('tags', oThis.entity_id_tags, oThis.getinitialTagsData);
        }
      });
      oThis.peopleSearchInput.autocomplete({
        source: function(request, response) {
          oThis.onInputChangePeople(request, response);
        },
        select: function(event, ui) {
          console.log('Selected:value ' + ui.item.value + ' id: ' + ui.item.id);
          oThis.entity_id_people = ui.item.id;
          oThis.userName = ui.item.value;
        }
      });
      oThis.tagSearchInput.autocomplete({
        source: function(request, response) {
          oThis.onInputChangeTags(request, response);
        },
        select: function(event, ui) {
          console.log('Selected:value ' + ui.item.value + ' id: ' + ui.item.id);
          oThis.entity_id_tags = ui.item.id;
          oThis.userName = ui.item.value;
        }
      });
      /*
      initialize sortable list with required callbacks
       */
      oThis.jPeopleListWrapper.sortable({
        update: function(event, ui) {
          var changedList = this.id,
            order = $(this).sortable('toArray'),
            entityKind = 'users',
            entityIds = order;
          console.log({ id: changedList, positions: order, item: ui.item });
          oThis.newOrder = order;
          oThis.onListOrderChanged(entityKind, ui.item[0].id);
        }
      });
      oThis.jTagsListWrapper.sortable({
        update: function(event, ui) {
          var changedList = this.id,
            order = $(this).sortable('toArray'),
            entityKind = 'tags',
            entityIds = order;
          console.log({ id: changedList, positions: order });
          oThis.newOrder = order;
          oThis.onListOrderChanged(entityKind, ui.item[0].id);
        }
      });
    },
    onInputChangeTags: function(request, response) {
      var oThis = this;
      $.ajax({
        url: oThis.apiUrl + '/admin/tags?q=' + request.term,
        type: 'GET',
        success: function(res) {
          console.log('res success');

          var tagsData = res.data.tags,
            formattedTagsData = [];
          if (tagsData && tagsData.length > 0) {
            oThis.jErrorBoxTags.text('');
            oThis.tagsIds = Object.keys(tagsData);
            for (var i = 0; i < oThis.tagsIds.length; i++) {
              var userId = tagsData[oThis.tagsIds[i]].id,
                label = tagsData[oThis.tagsIds[i]].text,
                value = tagsData[oThis.tagsIds[i]].text;
              formattedTagsData[i] = {
                id: tagsData[oThis.tagsIds[i]].id,
                label: tagsData[oThis.tagsIds[i]].text,
                value: tagsData[oThis.tagsIds[i]].text
              };
            }
          } else {
            oThis.jErrorBoxTags.text('No results');
          }

          response(formattedTagsData);
        },
        error: function(err) {
          console.log('res error');
        }
      });
    },
    onInputChangePeople: function(request, response) {
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
    onListOrderChanged: function(entityKind, entityId) {
      var oThis = this,
        position = oThis.determinePosition(false, entityKind, entityId);

      $.ajax({
        url: oThis.apiUrl + '/admin/curated-entities/update',
        type: 'POST',
        data: {
          entity_kind: entityKind,
          entity_id: entityId,
          position: position
        },
        headers: {
          'csrf-token': oThis.csrfToken
        },
        success: function(res) {
          if (res && res.success) {
            console.log('success');
          } else {
            console.log('api returned error');
            var errorMsg = oThis.getSpecificError(res);
            if (entityKind == 'users') {
              oThis.jErrorBox.text(errorMsg);
            } else {
              oThis.jErrorBoxTags.text(errorMsg);
            }
          }
        },
        error: function(err) {
          var errorMsg = oThis.getGeneralError(err);
          if (entityKind == 'users') {
            oThis.jErrorBox.text(errorMsg);
          } else {
            oThis.jErrorBoxTags.text(errorMsg);
          }
          if (entityKind === 'users') {
            oThis.getinitialPeopleData();
          } else {
            oThis.getinitialTagsData();
          }
        }
      });
    },
    countEntries: function(data, entityKind) {
      var oThis = this;
      var resultType = data.result_type,
        searchResult = data[resultType];
      oThis.totalEntriesTags = null;
      oThis.totalEntriesPeople = null;

      if (searchResult) {
        if (entityKind == 'users') {
          oThis.totalEntriesPeople = searchResult.length;
        } else {
          oThis.totalEntriesTags = searchResult.length;
        }
      }
    },
    getinitialPeopleData: function() {
      var oThis = this;

      $.ajax({
        url: 'http://pepodev.com:8080/api/admin/curated-entities/users',
        type: 'GET',
        headers: {
          'csrf-token': oThis.csrfToken
        },
        success: function(res) {
          if (res && res.success) {
            oThis.jErrorBox.text('');
            oThis.countEntries(res.data, 'users');
            oThis.initializeUsersTemplate(res.data);
            oThis.deleteBtn = $('.delete-entry');
            oThis.bindDeleteBtnClickEvent('users');
          } else {
            console.log('api returned error');
            oThis.jErrorBox.text(oThis.getSpecificError(res));
          }
        },
        error: function(err) {
          console.log('error');
          var errMsg = oThis.getGeneralError(err);
          oThis.jErrorBox.text(errMsg);
        }
      });
    },
    getinitialTagsData: function() {
      const oThis = this;

      $.ajax({
        url: oThis.apiUrl + '/admin/curated-entities/tags',
        type: 'GET',
        headers: {
          'csrf-token': oThis.csrfToken
        },
        success: function(res) {
          if (res && res.success) {
            oThis.jErrorBoxTags.text('');
            oThis.countEntries(res.data, 'tags');
            oThis.initializeTagsTemplate(res.data);
            oThis.deleteBtn = $('.delete-entry');
            oThis.bindDeleteBtnClickEvent('tags');
          } else {
            console.log('api returned error');
            oThis.jErrorBoxTags.text(oThis.getSpecificError(res));
          }
        },
        error: function(err) {
          console.log('error');
          oThis.jErrorBoxTags.text(oThis.getGeneralError(err));
        }
      });
    },
    getPeopleRowData: function(ListItemId, data) {
      const oThis = this;
      var templateData = {
        id: ListItemId,
        entryLabel: data[ListItemId].user_name
      };
      return templateData;
    },
    getTagRowData: function(ListItemId, data) {
      const oThis = this;
      var templateData = {
        id: ListItemId,
        entryLabel: data[ListItemId].text
      };
      return templateData;
    },
    initializeUsersTemplate: function(res) {
      const oThis = this;
      var source = document.getElementById('discover-list-item-template').innerHTML,
        listRowTemplate = Handlebars.compile(source),
        resultType = res.result_type,
        searchResultType = res[resultType],
        listRowTemplateHtml = '',
        listData = null;
      oThis.PeopleListData = res.users;
      oThis.searchResultType = searchResultType;

      for (var i = 0; i < searchResultType.length; i++) {
        listData = oThis.getPeopleRowData(searchResultType[i].entityId, oThis.PeopleListData);
        listRowTemplateHtml += listRowTemplate(listData);
      }
      oThis.jPeopleListWrapper.empty();
      oThis.jPeopleListWrapper.html(listRowTemplateHtml);
    },
    initializeTagsTemplate: function(res) {
      const oThis = this;
      var source = document.getElementById('discover-tag-list-item-template').innerHTML,
        tagListRowTemplate = Handlebars.compile(source),
        resultType = res.result_type,
        searchResultTagsList = res[resultType],
        tagListRowTemplateHtml = '',
        listData = null;
      oThis.tagsListData = res.tags;
      oThis.searchResultTagsList = searchResultTagsList;

      for (var i = 0; i < searchResultTagsList.length; i++) {
        listData = oThis.getTagRowData(searchResultTagsList[i].entityId, oThis.tagsListData);
        tagListRowTemplateHtml += tagListRowTemplate(listData);
      }
      oThis.jTagsListWrapper.empty();
      oThis.jTagsListWrapper.html(tagListRowTemplateHtml);
    },
    onAddBtnClick: function(entityKind, entityId, callback) {
      var oThis = this,
        position = oThis.determinePosition(true, entityKind, entityId);

      $.ajax({
        url: oThis.apiUrl + '/admin/curated-entities/update',
        type: 'POST',
        data: {
          entity_id: entityId,
          entity_kind: entityKind,
          position: position
        },
        headers: {
          'csrf-token': oThis.csrfToken
        },
        success: function(res) {
          if (res && res.success) {
            console.log('** success **');
            if (entityKind == 'users') {
              oThis.peopleSearchInput.val('');
            } else {
              oThis.tagSearchInput.val('');
            }

            callback();
          } else {
            console.log('** api returned error **');
            var errorMsg = oThis.getSpecificError(res);
            if (entityKind == 'users') {
              oThis.jErrorBox.text(errorMsg);
            } else {
              oThis.jErrorBoxTags.text(errorMsg);
            }
          }
        },
        error: function(err) {
          console.log('** error **');
          var errMsg = oThis.getGeneralError(err);
          if (entityKind == 'users') {
            oThis.jErrorBox.text(errMsg);
          } else {
            oThis.jErrorBoxTags.text(errMsg);
          }
        }
      });
    },
    determinePosition: function(isNewEntry, entityKind, entityId) {
      var oThis = this,
        positionsData = oThis.determinebeforeAndAfterPosition(isNewEntry, entityKind, entityId),
        newPosition = (positionsData.beforeDataElement + positionsData.afterDataElement) / 2;
      return newPosition;
    },
    determinebeforeAndAfterPosition: function(isNewEntry, entityKind, entityId) {
      var oThis = this,
        beforeDataElement = null,
        afterDataElement = null,
        positionsData = null,
        searchResultType = null,
        afterDataElementId = null,
        beforeDataElementId = null;
      if (entityKind == 'users') {
        searchResultType = oThis.searchResultType;
      } else {
        searchResultType = oThis.searchResultTagsList;
      }
      console.log('oThis.searchResultType', searchResultType);
      console.log('oThis.peopleListData', oThis.PeopleListData);
      if (isNewEntry) {
        beforeDataElement = 0;
        afterDataElement = searchResultType[0].position;
      } else {
        for (var i = 0; i < oThis.newOrder.length; i++) {
          if (oThis.newOrder[i] == entityId) {
            beforeDataElementId = oThis.newOrder[i - 1] ? oThis.newOrder[i - 1] : null;
            afterDataElementId = oThis.newOrder[i + 1] ? oThis.newOrder[i + 1] : null;
          }
        }
        for (var j = 0; j < searchResultType.length; j++) {
          if (searchResultType[j].entityId == beforeDataElementId) {
            beforeDataElement = searchResultType[j].position;
          }
          if (searchResultType[j].entityId == afterDataElementId) {
            afterDataElement = searchResultType[j].position;
          }
        }
        if (afterDataElement == null) {
          afterDataElement = beforeDataElement + 10000;
        }
        if (beforeDataElement == null) {
          beforeDataElement = 0;
        }
      }
      positionsData = {
        beforeDataElement: beforeDataElement,
        afterDataElement: afterDataElement
      };

      return positionsData;
    },
    getBeforeAndAfterPosition: function(isNewEntry) {},
    bindDeleteBtnClickEvent: function(entityKind) {
      const oThis = this;
      oThis.deleteBtn.on('click', function() {
        oThis.deleteEntryClick($(this), entityKind);
      });
    },
    deleteEntryClick: function(jDeleteBtn, entityKind) {
      const oThis = this;
      var entityID = jDeleteBtn.data('id'),
        entityKind = entityKind;
      $.ajax({
        url: oThis.apiUrl + '/admin/curated-entities/delete',
        type: 'POST',
        data: {
          entity_kind: entityKind,
          entity_id: entityID
        },
        headers: {
          'csrf-token': oThis.csrfToken
        },
        success: function(res) {
          if (res) {
            if (res.success) {
              console.log('** success **');
              if (entityKind === 'users') {
                oThis.getinitialPeopleData();
              } else {
                oThis.getinitialTagsData();
              }
            } else {
              console.log('** error **');
              if (entityKind == 'users') {
                oThis.jErrorBox.text(oThis.getSpecificError(res));
              } else {
                oThis.jErrorBoxTags.text(oThis.getSpecificError(res));
              }
            }
          }
        },
        error: function(err) {
          console.log('** error **');
          if (entityKind == 'users') {
            oThis.jErrorBox.text(oThis.getGeneralError(err));
          } else {
            oThis.jErrorBoxTags.text(oThis.getGeneralError(err));
          }
        }
      });
    },
    getSpecificError: function(res) {
      var errorMsg = res && res.err && res.err.error_data[0] && res.err.error_data[0].msg;
      return errorMsg;
    },
    getGeneralError: function(err) {
      var errorMsg = err && err.responseJSON && err.responseJSON.err && err.responseJSON.err.msg;
      return errorMsg;
    }
  };
  window.Discover = Discover;
})(window, jQuery);
