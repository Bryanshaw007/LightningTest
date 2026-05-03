({
  navigateAfterDone: function (component) {
    var navService = component.find("navService");
    var parentId = component.get("v.parentAccountId");
    var pageRef;

    if (parentId) {
      pageRef = {
        type: "standard__recordPage",
        attributes: {
          recordId: parentId,
          objectApiName: "Account",
          actionName: "view"
        }
      };
    } else {
      pageRef = {
        type: "standard__objectPage",
        attributes: {
          objectApiName: "Address__c",
          actionName: "list"
        },
        state: {
          filterName: "Recent"
        }
      };
    }

    navService.navigate(pageRef);

    // Refresh the destination so newly-created Address shows up in related lists / list view
    var refresh = $A.get("e.force:refreshView");
    if (refresh) {
      refresh.fire();
    }
  }
});
