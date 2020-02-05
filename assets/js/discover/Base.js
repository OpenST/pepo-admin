(function(window, $) {
  var Base = function() {
    var oThis = this;
    oThis.MAX_ALLOWED_ENTRIES = 20;
    oThis.INVALID_INPUT_MSG = 'Please enter valid input.';
    oThis.apiUrl = $('meta[name="api-url"]').attr('content');
    oThis.csrfToken = $('meta[name="csrf-token"]').attr('content');
  };
  Base.prototype = {
    getInitialData: function() {
      var oThis = this;
      oThis.getData();
    },
    bindEventsParent: function() {
      var oThis = this;
      oThis.searchInput.autocomplete({
        source: function(request, response) {
          oThis.onInputChange(request, response);
        },
        select: function(event, ui) {
          console.log('Selected:value ' + ui.item.value + ' id: ' + ui.item.id);
          oThis.entity_id = ui.item.id;
        }
      });
      console.log('oThis.entityKind===', oThis.entityKind);
      oThis.jListWrapper
        .off('click.' + oThis.entityKind)
        .on('click.' + oThis.entityKind, oThis.deleteSelector, function() {
          var deleteConsent = window.confirm('Do you want to delete this entry ? ');
          if (true) {
            console.log('oThis', oThis);
            oThis.deleteEntryClick($(this));
          }
        });
    },

    deleteEntryClick: function(jDeleteBtn) {
      const oThis = this;
      var entityID = jDeleteBtn.data('id'),
        entityKind = oThis.entityKind;
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
          oThis.onDeleteSuccess(res);
        },
        error: function(err) {
          oThis.onDeleteError(err);
        }
      });
    },
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
    addEntry: function() {
      var oThis = this;
      if (oThis.totalEntries >= oThis.MAX_ALLOWED_ENTRIES) {
        // max limit should be 20
        oThis.jErrorBox.text(oThis.maxLimitReachedMsg);
      } else if (!oThis.entity_id) {
        // invalid input i.e blank or random
        oThis.jErrorBox.text(oThis.INVALID_INPUT_MSG);
      } else {
        oThis.onAddBtnClick(); //add new entry
      }
    },
    getData: function() {
      var oThis = this;

      $.ajax({
        url: oThis.apiUrl + oThis.config.url,
        type: 'GET',
        headers: {
          'csrf-token': oThis.csrfToken
        },
        success: function(res) {
          oThis.onSuccess(res);
        },
        error: function(err) {
          oThis.onError(err); //TODO test error case
        }
      });
    },
    onSuccess: function(res) {
      var oThis = this;
      if (res && res.success) {
        oThis.emptyErrorBox();
        oThis.initializeTemplateData(res.data);
      } else {
        oThis.jErrorBox.text(oThis.getSpecificError(res));
      }
    },
    onError: function(err) {
      var oThis = this;
      var errMsg = oThis.getGeneralError(err);
      oThis.jErrorBox.text(errMsg);
    },
    initSortable: function() {
      var oThis = this;
      oThis.jListWrapper.sortable({
        update: function(event, ui) {
          var changedList = this.id,
            order = $(this).sortable('toArray'),
            entityKind = oThis.entityKind;
          console.log({ id: changedList, positions: order, item: ui.item });
          oThis.newOrder = order;
          $('.dragable-element').addClass('disable-events');
          oThis.onListOrderChanged(entityKind, ui.item[0].id);
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
          oThis.onListOrderChangedSuccess(res);
        },
        error: function(err) {
          oThis.onListOrderChangedError(err);
        }
      });
    },
    onListOrderChangedSuccess: function(res) {
      var oThis = this;
      if (res && res.success) {
        oThis.getData();
        $('.dragable-element').removeClass('disable-events');
      } else {
        var errorMsg = oThis.getSpecificError(res);
        oThis.jErrorBox.text(errorMsg);
      }
    },
    onListOrderChangedError: function(res) {
      var oThis = this;
      var errorMsg = oThis.getGeneralError(err);
      oThis.jErrorBox.text(errorMsg);
      oThis.getData();
    },
    getSpecificError: function(res) {
      var errorMsg = res && res.err && res.err.error_data[0] && res.err.error_data[0].msg;
      return errorMsg;
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
      searchResultType = oThis.searchResultType;
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
    emptyErrorBox: function() {
      var oThis = this;
      oThis.jErrorBox.text('');
    },

    onAddBtnClick: function() {
      var oThis = this,
        position = oThis.determinePosition(true, oThis.entityKind, oThis.entity_id);
      $.ajax({
        url: oThis.apiUrl + '/admin/curated-entities/update',
        type: 'POST',
        data: {
          entity_id: oThis.entity_id,
          entity_kind: oThis.entityKind,
          position: position
        },
        headers: {
          'csrf-token': oThis.csrfToken
        },
        success: function(res) {
          oThis.onAddBtnClickSuccess(res);
        },
        error: function(err) {
          oThis.onAddBtnClickError(err);
        }
      });
    },
    onAddBtnClickSuccess: function(res) {
      var oThis = this;
      oThis.entity_id = null;
      if (res && res.success) {
        oThis.searchInput.val('');
        oThis.getData();
      } else {
        console.log('** api returned error ::onAddBtnClickSuccess **');
        var errorMsg = oThis.getSpecificError(res);
        oThis.jErrorBox.text(errorMsg);
      }
    },
    onAddBtnClickError: function(err) {
      var oThis = this;
      oThis.entity_id = null;
      console.log('** Error :: onAddBtnClickSuccess**');
      var errMsg = oThis.getGeneralError(err);
      oThis.jErrorBox.text(errMsg);
    },

    getSpecificError: function(res) {
      var errorMsg = _.get(res, 'err.error_data[0].msg', 'api returned error');
      return errorMsg;
    },
    getGeneralError: function(err) {
      var errorMsg = _.get(res, 'err.responseJSON.err.msg', 'Something went wrong');
      return errorMsg;
    }
  };
  window.BaseClass = Base;
})(window, jQuery);
