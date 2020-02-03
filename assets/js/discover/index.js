(function(window, $) {
  const Discover = function() {
    const oThis = this;
    oThis.config = {};
    oThis.MaxAllowedEntries = 20;
    oThis.apiUrl = $('meta[name="api-url"]').attr('content');
    oThis.csrfToken = $('meta[name="csrf-token"]').attr('content');
    // add buttons
    oThis.jPeopleAddBtn = $('#add-people-btn');
    oThis.jAddTagsBtn = $('#add-tags-btn');
    oThis.jAddChannelBtn = $('#add-channel-btn');
    //Templates
    oThis.jListTemplate = $('#discover-list-item-template');
    oThis.jChannelListTemplate = $('discover-channel-list-item-template');
    // List Wrappers
    oThis.jPeopleListWrapper = $('#people-list');
    oThis.jTagsListWrapper = $('#tags-list');
    oThis.jChannelListWrapper = $('#channels-list');
    //Data variables declaration
    oThis.PeopleListData = null;
    oThis.TagListData = null;
    oThis.ChannelsListData = null;
    //error containers
    oThis.jErrorBox = $('#people-list-tab #error-box');
    oThis.jErrorBoxTags = $('#tags-list-tab #error-box');
    oThis.jErrorBoxChannels = $('#channels-list-tab #error-box');
    //search input box
    oThis.peopleSearchInput = $('#searchPeopleInput');
    oThis.tagSearchInput = $('#searchTagInput');
    oThis.channelSearchInput = $('#searchChannelInput');

    oThis.sRowWrapper = 'item-wrapper';

    //default messages
    oThis.maxLimitMsgPeople = 'Can only add upto 20 people.';
    oThis.maxLimitMsgTag = 'Can only add upto 20 tags.';
    oThis.emptyInputBox = 'Please enter valid input.';
    oThis.maxLimitMsgChannel = 'Can only add upto 20 tags.';

    oThis.totalEntriesTags = null;
    oThis.totalEntriesPeople = null;
    oThis.bindEvents();
    oThis.initAutocompletePeople();
    oThis.initAutocompleteTags();
    oThis.initAutocompleteChannels();
    oThis.getinitialPeopleData = oThis.getinitialPeopleData.bind(oThis);
    oThis.initializeUsersTemplate = oThis.initializeUsersTemplate.bind(oThis);
    oThis.getinitialTagsData = oThis.getinitialTagsData.bind(oThis);
    oThis.initializeTagsTemplate = oThis.initializeTagsTemplate.bind(oThis);
    oThis.getinitialChannelData = oThis.getinitialChannelData.bind(oThis);
    oThis.initializeChannelsTemplate = oThis.initializeChannelsTemplate.bind(oThis);
    oThis.getinitialPeopleData();
    oThis.getinitialTagsData();
    oThis.getinitialChannelData();
  };

  Discover.prototype = {
    bindEvents: function() {
      const oThis = this;
      oThis.jPeopleAddBtn.on('click', function() {
        if (oThis.totalEntriesPeople >= oThis.MaxAllowedEntries) {
          oThis.jErrorBox.text(oThis.maxLimitMsgPeople);
        } else if (!oThis.entity_id_people) {
          oThis.jErrorBox.text(oThis.emptyInputBox);
        } else {
          oThis.onAddBtnClick('users', oThis.entity_id_people, oThis.getinitialPeopleData);
        }
      });
      oThis.jAddTagsBtn.on('click', function() {
        if (oThis.totalEntriesTags >= oThis.MaxAllowedEntries) {
          oThis.jErrorBoxTags.text(oThis.maxLimitMsgTag);
        } else if (!oThis.entity_id_tags) {
          oThis.jErrorBoxTags.text(oThis.emptyInputBox);
        } else {
          oThis.onAddBtnClick('tags', oThis.entity_id_tags, oThis.getinitialTagsData);
        }
      });
      oThis.jAddChannelBtn.on('click', function() {
        if (oThis.totalEntriesChannels >= oThis.MaxAllowedEntries) {
          oThis.jErrorBoxChannels.text(oThis.maxLimitMsgChannel);
        } else if (!oThis.entity_id_channels) {
          oThis.jErrorBoxChannels.text(oThis.emptyInputBox);
        } else {
          oThis.onAddBtnClick('channels', oThis.entity_id_tags, oThis.getinitialTagsData);
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
      oThis.channelSearchInput.autocomplete({
        source: function(request, response) {
          oThis.onInputChangeChannel(request, response);
        },
        select: function(event, ui) {
          console.log('Selected:value ' + ui.item.value + ' id: ' + ui.item.id);
          oThis.entity_id_channels = ui.item.id;
          oThis.userName = ui.item.value;
        }
      });
    },
    initAutocompletePeople: function() {
      /*
      initialize sortable list with required callbacks
       */
      var oThis = this;
      oThis.jPeopleListWrapper.sortable({
        update: function(event, ui) {
          var changedList = this.id,
            order = $(this).sortable('toArray'),
            entityKind = 'users',
            entityIds = order;
          console.log({ id: changedList, positions: order, item: ui.item });
          oThis.newOrder = order;
          $('.dragable-element').addClass('disable-events');
          oThis.onListOrderChanged(entityKind, ui.item[0].id);
        }
      });
    },
    initAutocompleteTags: function() {
      /*
      initialize sortable list with required callbacks
       */
      var oThis = this;
      oThis.jTagsListWrapper.sortable({
        update: function(event, ui) {
          var changedList = this.id,
            order = $(this).sortable('toArray'),
            entityKind = 'tags',
            entityIds = order;
          console.log({ id: changedList, positions: order });
          oThis.newOrder = order;
          $('.dragable-element').addClass('disable-events');
          oThis.onListOrderChanged(entityKind, ui.item[0].id);
        }
      });
    },
    initAutocompleteChannels: function() {
      /*
      initialize sortable list with required callbacks
       */
      var oThis = this;
      oThis.jChannelListWrapper.sortable({
        update: function(event, ui) {
          var changedList = this.id,
            order = $(this).sortable('toArray'),
            entityKind = 'channels',
            entityIds = order;
          console.log({ id: changedList, positions: order });
          oThis.newOrder = order;
          $('.dragable-element').addClass('disable-events');
          oThis.onListOrderChanged(entityKind, ui.item[0].id);
        }
      });
    },
    formatTagsData: function(tagsData) {
      var oThis = this,
        formattedTagsData = [];

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
      return formattedTagsData;
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
    formatChannelsdata: function(channelsData) {
      var oThis = this,
        formattedChannelsData = [];
      oThis.channelIds = Object.keys(channelsData);
      for (var i = 0; i < oThis.channelIds.length; i++) {
        var userId = channelsData[oThis.channelIds[i]].id,
          label = channelsData[oThis.channelIds[i]].name,
          value = channelsData[oThis.channelIds[i]].name;
        formattedChannelsData[i] = {
          id: channelsData[oThis.channelIds[i]].id,
          label: channelsData[oThis.channelIds[i]].name,
          value: channelsData[oThis.channelIds[i]].name
        };
      }

      return formattedChannelsData;
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
            formattedTagsData = oThis.formatTagsData(tagsData);
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
    onInputChangeChannel: function(request, response) {
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
            if (entityKind == 'users') {
              oThis.getinitialPeopleData();
            } else if (entityKind == 'tags') {
              oThis.getinitialTagsData();
            } else {
              oThis.getinitialChannelData();
            }
            $('.dragable-element').removeClass('disable-events');
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

      if (searchResult) {
        if (entityKind == 'users') {
          oThis.totalEntriesPeople = searchResult.length;
        } else if (entityKind == 'tags') {
          oThis.totalEntriesTags = searchResult.length;
        } else {
          oThis.totalEntriesChannels = searchResult.length;
        }
      }
    },
    getinitialPeopleData: function() {
      var oThis = this;

      $.ajax({
        url: oThis.apiUrl + '/admin/curated-entities/users',
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
    getinitialChannelData: function() {
      var oThis = this;

      $.ajax({
        url: oThis.apiUrl + '/admin/curated-entities/channels',
        type: 'GET',
        headers: {
          'csrf-token': oThis.csrfToken
        },
        success: function(res) {
          if (res && res.success) {
            oThis.jErrorBox.text('');
            oThis.countEntries(res.data, 'channels');
            oThis.initializeChannelsTemplate(res.data);
            oThis.deleteBtn = $('.delete-entry');
            oThis.bindDeleteBtnClickEvent('channels');
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
    getChannelRowData: function(ListItemId, data) {
      const oThis = this;
      var templateData = {
        id: ListItemId,
        entryLabel: data[ListItemId].permalink
      };
      return templateData;
    },
    initializeUsersTemplate: function(res) {
      const oThis = this;
      var source = document.getElementById('discover-list-item-template').innerHTML,
        listRowTemplate = Handlebars.compile(source),
        resultType = res.result_type,
        searchResultType = res[resultType] || [],
        listRowTemplateHtml = '',
        listData = null;
      oThis.PeopleListData = res.users || {};
      oThis.searchResultType = searchResultType;

      for (var i = 0; i < searchResultType.length; i++) {
        listData = oThis.getPeopleRowData(searchResultType[i].entityId, oThis.PeopleListData);
        listRowTemplateHtml += listRowTemplate(listData);
      }
      oThis.jPeopleListWrapper.empty();
      oThis.jPeopleListWrapper.html(listRowTemplateHtml);
    },

    initializeChannelsTemplate: function(res) {
      const oThis = this;
      var source = document.getElementById('discover-channel-list-item-template').innerHTML,
        listRowTemplate = Handlebars.compile(source),
        resultType = res.result_type,
        searchResultChannelsList = res[resultType] || [],
        listRowTemplateHtml = '',
        listData = null;
      oThis.ChannelsListData = res.channels || {};
      oThis.searchResultChannelsList = searchResultChannelsList;

      for (var i = 0; i < searchResultChannelsList.length; i++) {
        listData = oThis.getChannelRowData(searchResultChannelsList[i].entityId, oThis.ChannelsListData);
        listRowTemplateHtml += listRowTemplate(listData);
      }
      oThis.jChannelListWrapper.empty();
      oThis.jChannelListWrapper.html(listRowTemplateHtml);
    },
    initializeTagsTemplate: function(res) {
      const oThis = this;
      var source = document.getElementById('discover-tag-list-item-template').innerHTML,
        tagListRowTemplate = Handlebars.compile(source),
        resultType = res.result_type,
        searchResultTagsList = res[resultType] || [],
        tagListRowTemplateHtml = '',
        listData = null;
      oThis.tagsListData = res.tags || {};
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
          oThis.entity_id_tags = null;
          oThis.entity_id_people = null;
          if (res && res.success) {
            console.log('** success **');
            if (entityKind == 'users') {
              oThis.peopleSearchInput.val('');
            } else if (entityKind == 'tags') {
              oThis.tagSearchInput.val('');
            } else {
              oThis.channelSearchInput.val('');
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
          oThis.entity_id_tags = null;
          oThis.entity_id_people = null;
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
      } else if (entityKind == 'tags') {
        searchResultType = oThis.searchResultTagsList;
      } else {
        searchResultType = oThis.searchResultChannelsList;
      }
      console.log('oThis.searchResultType', searchResultType);
      console.log('oThis.peopleListData', oThis.PeopleListData);
      if (isNewEntry) {
        beforeDataElement = 0;
        if (searchResultType.length === 0) {
          afterDataElement = 100000000;
        } else {
          afterDataElement = searchResultType[0].position;
        }
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
    bindDeleteBtnClickEvent: function() {
      var oThis = this,
        entityKind = '';

      oThis.deleteBtn.off().on('click', function() {
        var deleteConsent = window.confirm('Do you want to delete this entry ? ');
        if (deleteConsent) {
          var activeTab = $('.nav-item .active').text();
          if (activeTab == 'Tags') {
            entityKind = 'tags';
          } else if (activeTab == 'People') {
            entityKind = 'users';
          } else {
            entityKind = 'channels';
          }
          oThis.deleteEntryClick($(this), entityKind);
        }
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
              } else if (entityKind === 'tags') {
                oThis.getinitialTagsData();
              } else {
                oThis.getinitialChannelData();
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
