(function(window, $) {
  const Discover = function() {
    const oThis = this;
    oThis.config = {};
    oThis.apiUrl = $('meta[name="api-url"]').attr('content');
    oThis.csrfToken = $('meta[name="csrf-token"]').attr('content');
    oThis.jAddBtn = $('#add-people-btn');
    oThis.jListTemplate = $('#discover-list-item-template');
    oThis.jPeopleListWrapper = $('#people-list');
    oThis.jTagsListWrapper = $('#tags-list');
    oThis.PeopleListData = null;
    oThis.TagListData = null;
    oThis.jErrorBox = $('#error-box');
    oThis.jAddTagsBtn = $('#add-tags-btn');
    oThis.peopleSearchInput = $('#searchPeopleInput');
    oThis.bindEvents();
    oThis.getinitialPeopleData();
    oThis.getinitialTagsData();

    $('ul, li').disableSelection();
  };

  Discover.prototype = {
    bindEvents: function() {
      const oThis = this;
      oThis.jAddBtn.on('click', function() {
        oThis.onAddBtnClick('users', oThis.user_id, oThis.getinitialPeopleData);
      });
      oThis.jAddTagsBtn.on('click', function() {
        oThis.onAddBtnClick('tags', entityId, oThis.getinitialTagsData);
      });
      oThis.peopleSearchInput.autocomplete({
        source: function(request, response) {
          oThis.onInputChange(request, response);
        },
        select: function(event, ui) {
          console.log('Selected:value ' + ui.item.value + ' id: ' + ui.item.id);
          oThis.entity_id = ui.item.id;
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
          console.log({ id: changedList, positions: order });
          oThis.onListOrderChanged(entityKind, entityIds);
        }
      });
      oThis.jTagsListWrapper.sortable({
        update: function(event, ui) {
          var changedList = this.id,
            order = $(this).sortable('toArray'),
            entityKind = 'tags',
            entityIds = order;
          console.log({ id: changedList, positions: order });
          oThis.onListOrderChanged(entityKind, entityIds);
        }
      });
    },
    onInputChange: function(request, response) {
      var oThis = this;
      $.ajax({
        url: oThis.apiUrl + '/admin/users?q=' + request.term,
        type: 'GET',
        success: function(res) {
          console.log('res success');

          var usersData = res.data.users,
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

          response(formattedUsersData);
        },
        error: function(err) {
          console.log('res error');
        }
      });
    },
    onListOrderChanged: function(entityKind, entityIds) {
      const oThis = this;

      $.ajax({
        url: oThis.apiUrl + '/admin/curated-entities/reorder',
        data: {
          entity_ids: entityIds,
          entity_kind: entityKind
        },
        success: function(res) {
          if (res && res.success) {
            console.log('success');
          } else {
            console.log('api returned error');
            var errorMsg = oThis.getSpecificError(res);
            oThis.jErrorBox.text(errorMsg);
          }
        },
        error: function(err) {
          console.log('error');
          var errorMsg = oThis.getGeneralError(err);
          oThis.jErrorBox.text(errorMsg);
          if (entityKind === 'users') {
            oThis.getinitialPeopleData();
          } else {
            oThis.getinitialTagsData();
          }
        }
      });
    },
    getinitialPeopleData: function() {
      const oThis = this;

      $.ajax({
        url: oThis.apiUrl + '/admin/curated-entities/users',
        type: 'GET',
        headers: {
          'csrf-token': oThis.csrfToken
        },
        success: function(res) {
          if (res && res.success) {
            console.log('success');

            oThis.initializeUsersTemplate(res.data);
            oThis.deleteBtn = $('.delete-entry');
            oThis.bindDeleteBtnClickEvent('users');
          } else {
            console.log('api returned error');
          }
        },
        error: function(err) {
          console.log('error');
          var errMsg = oThis.getGeneralError(err);
          oThis.jErrorBox.text(errMsg);
          // // // TODO remove this after testing
          // var res = {
          //   result_type: 'users_curated_list',
          //   users_curated_list: [1, 2],
          //   users: {
          //     '1': {
          //       username: 'shraddha'
          //     },
          //     '2': {
          //       username: 'preshita'
          //     }
          //   }
          // };
          // oThis.initializeUsersTemplate(res);
          // oThis.deleteBtn = $('.delete-entry');
          // oThis.bindDeleteBtnClickEvent('users');
        }
      });
    },
    getinitialTagsData: function() {
      const oThis = this;

      $.ajax({
        url: oThis.getTagsApi(),
        type: 'GET',
        headers: {
          'csrf-token': oThis.csrfToken
        },
        success: function(res) {
          if (res && res.success) {
            console.log('success');
            oThis.initializeTagsTemplate(res.data);
            oThis.deleteBtn = $('.delete-entry');
            oThis.bindDeleteBtnClickEvent('tags');
          } else {
            console.log('api returned error');
          }
        },
        error: function(err) {
          console.log('error');
          // var errMsg = oThis.getGeneralError(err);
          // oThis.jErrorBox.text(errMsg);
          // // // TODO remove this after testing
          // var res = {
          //   result_type: 'tags_curated_list',
          //   tags_curated_list: [1, 2],
          //   tags: {
          //     '1': {
          //       tagName: '#shraddha'
          //     },
          //     '2': {
          //       tagName: '#preshita'
          //     }
          //   }
          // };
          // oThis.initializeTagsTemplate(res);
          // oThis.deleteBtn = $('.delete-entry');
          // oThis.bindDeleteBtnClickEvent('tags');
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
        peopleList = res[resultType],
        listRowTemplateHtml = '',
        listData = null;
      oThis.PeopleListData = res.users;

      for (var i = 0; i < peopleList.length; i++) {
        listData = oThis.getPeopleRowData(peopleList[i], oThis.PeopleListData);
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
        tagsList = res[resultType],
        tagListRowTemplateHtml = '',
        listData = null;
      oThis.tagsListData = res.tags;

      for (var i = 0; i < tagsList.length; i++) {
        listData = oThis.getTagRowData(tagsList[i], oThis.tagsListData);
        tagListRowTemplateHtml += tagListRowTemplate(listData);
      }
      oThis.jTagsListWrapper.empty();
      oThis.jTagsListWrapper.html(tagListRowTemplateHtml);
    },
    onAddBtnClick: function(entityKind, entityId, callback) {
      const oThis = this;
      oThis.determinePosition(true);
      $.ajax({
        url: oThis.apiUrl + '/admin/curated-entities/insert',
        type: 'POST',
        data: {
          entity_id: entityId,
          entity_kind: entityKind
        },
        headers: {
          'csrf-token': oThis.csrfToken
        },
        success: function(res) {
          if (res && res.success) {
            console.log('** success **');
            callback();
          } else {
            console.log('** api returned error **');
            var errorMsg = oThis.getSpecificError(res);
            oThis.jErrorBox.text(errorMsg);
          }
        },
        error: function(err) {
          console.log('** error **');
          var errMsg = oThis.getGeneralError(err);
          oThis.jErrorBox.text(errMsg);
        }
      });
    },
    determinePosition: function(isNewEntry) {
      var oThis = this;
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
          current_admin: '',
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
              oThis.jErrorBox.text(oThis.getSpecificError(res));
            }
          }
        },
        error: function(err) {
          console.log('** error **');
          oThis.jErrorBox.text(oThis.getGeneralError(err));
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
    },
    clearErrors: function() {
      const oThis = this;
      oThis.jErrorBox.text('');
    },
    getUsersApi: function() {
      const oThis = this;
      return oThis.apiUrl + '/admin/curated-entities/users';
    },
    getTagsApi: function() {
      const oThis = this;
      return oThis.apiUrl + '/admin/curated-entities/tags';
    }
  };
  window.Discover = Discover;
})(window, jQuery);
