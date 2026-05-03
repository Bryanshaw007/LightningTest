({
  doInit: function (component, event, helper) {
    var params = new URLSearchParams(window.location.search);
    var openNew = params.get("c__openNewAddress") === "1";
    var editAddressId = params.get("c__editAddress");

    if (!openNew && !editAddressId) {
      return;
    }

    var recordId = component.get("v.recordId");
    console.log("AddressModalLauncher: recordId:", recordId, "openNew:", openNew, "editAddressId:", editAddressId);

    // Strip the flags so a page refresh doesn't reopen the modal
    params.delete("c__openNewAddress");
    params.delete("c__editAddress");
    var newSearch = params.toString();
    var cleanUrl = window.location.pathname + (newSearch ? "?" + newSearch : "");
    window.history.replaceState({}, "", cleanUrl);

    var componentAttrs = openNew
      ? { parentAccountId: recordId }
      : { recordId: editAddressId };
    var modalHeader = openNew ? "New Address" : "Edit Address";

    $A.createComponent(
      "c:AddressFormContent",
      componentAttrs,
      function (content, status, errorMessage) {
        if (status === "SUCCESS") {
          component.find("overlayLib").showCustomModal({
            header: modalHeader,
            body: content,
            showCloseButton: true,
            cssClass: "slds-modal_medium"
          });
        } else {
          console.error("AddressModalLauncher createComponent failed:", status, errorMessage);
        }
      }
    );
  }
});