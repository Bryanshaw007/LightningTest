({
  processUrl: function (component) {
    var recordId = component.get("v.recordId");
    var isEdit = !!recordId;
    console.log("AddressNewOverride processUrl. recordId:", recordId, "isEdit:", isEdit);

    var decoded = decodeURIComponent(window.location.href);
    console.log("AddressNewOverride decoded URL:", decoded);

    var isListView = false;
    var listFilterName = "Recent";
    var closeNavTarget = null;
    var refMatch = decoded.match(/inContextOfRef=1\.([A-Za-z0-9+/=]+)/);
    if (refMatch) {
      try {
        var ref = JSON.parse(atob(refMatch[1]));
        console.log("AddressNewOverride inContextOfRef parsed:", JSON.stringify(ref, null, 2));

        if (ref.type === "standard__recordPage" && ref.attributes && ref.attributes.objectApiName === "Account") {
          var accountId = ref.attributes.recordId;
          var navEvt = $A.get("e.force:navigateToURL");
          if (!isEdit) {
            console.log("AddressNewOverride redirecting to Account for new:", accountId);
            navEvt.setParams({ url: "/lightning/r/Account/" + accountId + "/view?c__openNewAddress=1" });
          } else {
            console.log("AddressNewOverride redirecting to Account for edit:", accountId, "addressId:", recordId);
            navEvt.setParams({ url: "/lightning/r/Account/" + accountId + "/view?c__editAddress=" + recordId, isredirect: true });
          }
          navEvt.fire();
          return;
        }

        if (ref.type === "standard__objectPage" && ref.attributes && ref.attributes.objectApiName === "Address__c") {
          isListView = true;
          listFilterName = (ref.state && ref.state.filterName) ? ref.state.filterName : "Recent";
          component.set("v.listFilterName", listFilterName);
          component.set("v.showListView", true);
          closeNavTarget = {
            type: "standard__objectPage",
            attributes: { objectApiName: "Address__c", actionName: "list" },
            state: { filterName: listFilterName }
          };
        }

        if (ref.type === "standard__recordPage" && ref.attributes && ref.attributes.objectApiName === "Address__c") {
          var contextAddressId = ref.attributes.recordId;
          if (isEdit) {
            // Edit from Address record page: redirect back with flag so AddressModalLauncher opens Edit modal
            console.log("AddressNewOverride redirecting to Address record for edit:", recordId);
            var navEvt = $A.get("e.force:navigateToURL");
            navEvt.setParams({ url: "/lightning/r/Address__c/" + recordId + "/view?c__editAddress=" + recordId, isredirect: true });
          } else {
            // New from Address record page: redirect to that Address record page with openNewAddress flag
            console.log("AddressNewOverride redirecting to Address record for new, contextAddressId:", contextAddressId);
            var navEvt = $A.get("e.force:navigateToURL");
            navEvt.setParams({ url: "/lightning/r/Address__c/" + contextAddressId + "/view?c__openNewAddress=1", isredirect: true });
          }
          navEvt.fire();
          return;
        }
      } catch (e) {
        console.warn("AddressNewOverride inContextOfRef decode failed:", e);
      }
    }

    // Edit from Account context via backgroundContext (e.g. editing a primary address link on Account detail page)
    if (isEdit) {
      var bgMatch = decoded.match(/backgroundContext=\/lightning\/r\/Account\/(001[A-Za-z0-9]{12,15})\/view/);
      if (bgMatch) {
        var bgAccountId = bgMatch[1];
        console.log("AddressNewOverride redirecting to Account (backgroundContext) for edit:", bgAccountId, "addressId:", recordId);
        var navEvt = $A.get("e.force:navigateToURL");
        navEvt.setParams({ url: "/lightning/r/Account/" + bgAccountId + "/view?c__editAddress=" + recordId, isredirect: true });
        navEvt.fire();
        return;
      }
    }

    // Fallback: defaultFieldValues=Account__c=001xxx (e.g. from a custom button with {!Account.Id}) — new mode only
    var defaultFieldMatch = !isEdit && decoded.match(/defaultFieldValues=(?:[^&]*&)*?Account__c=(001[A-Za-z0-9]{12,15})/);
    if (!isEdit && !defaultFieldMatch) {
      defaultFieldMatch = decoded.match(/Account__c=(001[A-Za-z0-9]{12,15})/);
    }

    // ConditionalRendering: Name=ConditionalRendering in URL means this is a smart new/edit button
    // Address__c value present → edit that address; absent → new address. Both use Account page as background.
    if (defaultFieldMatch && decoded.indexOf("Name=ConditionalRendering") !== -1) {
      var crAccountId = defaultFieldMatch[1];
      var crAddressMatch = decoded.match(/Address__c=(a0[A-Za-z0-9]{12,15})/);
      var crAddressId = crAddressMatch ? crAddressMatch[1] : null;
      console.log("AddressNewOverride ConditionalRendering accountId:", crAccountId, "addressId:", crAddressId);
      var navEvt = $A.get("e.force:navigateToURL");
      if (crAddressId) {
        navEvt.setParams({ url: "/lightning/r/Account/" + crAccountId + "/view?c__editAddress=" + crAddressId, isredirect: true });
      } else {
        navEvt.setParams({ url: "/lightning/r/Account/" + crAccountId + "/view?c__openNewAddress=1" });
      }
      navEvt.fire();
      return;
    }

    if (defaultFieldMatch) {
      var fallbackParentId = defaultFieldMatch[1];
      console.log("AddressNewOverride defaultFieldValues parentId:", fallbackParentId);
      var navEvt = $A.get("e.force:navigateToURL");
      navEvt.setParams({
        url: "/lightning/r/Account/" + fallbackParentId + "/view?c__openNewAddress=1"
      });
      navEvt.fire();
      return;
    }

    // Default closeNavTarget for edit with no recognised context: go to Address record
    if (isEdit && !closeNavTarget) {
      closeNavTarget = {
        type: "standard__recordPage",
        attributes: { recordId: recordId, objectApiName: "Address__c", actionName: "view" }
      };
    }

    $A.createComponent(
      "c:AddressFormContent",
      { parentAccountId: null, recordId: isEdit ? recordId : null },
      function (content, status, errorMessage) {
        if (status === "SUCCESS") {
          component.find("overlayLib").showCustomModal({
            header: isEdit ? "Edit Address" : "New Address",
            body: content,
            showCloseButton: true,
            cssClass: "slds-modal_medium",
            closeCallback: function () {
              if (closeNavTarget) {
                component.find("navService").navigate(closeNavTarget);
              } else if (isListView) {
                component.find("navService").navigate({
                  type: "standard__objectPage",
                  attributes: { objectApiName: "Address__c", actionName: "list" },
                  state: { filterName: listFilterName }
                });
              }
            }
          });
        } else {
          console.error("AddressNewOverride createComponent failed:", status, errorMessage);
        }
      }
    );
  }
});
