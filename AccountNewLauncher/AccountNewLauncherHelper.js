({
  openNewAccountModal: function (component) {
    window.setTimeout(
      $A.getCallback(function () {
        if (!component.isValid()) return;
        $A.createComponent(
          "c:AccountFormContent",
          {},
          function (content, status, errorMessage) {
            if (status === "SUCCESS") {
              component.find("overlayLib").showCustomModal({
                header: "New Account",
                body: content,
                showCloseButton: true,
                cssClass: "slds-modal_medium"
              });
            } else {
              console.error(
                "AccountNewLauncher createComponent failed:",
                status,
                errorMessage
              );
            }
          }
        );
      }),
      1000
    );
  },

  interceptNewButton: function (component, retryCount) {
    var self = this;
    var count = retryCount || 0;
    if (count > 30) return;
    window.setTimeout(
      $A.getCallback(function () {
        if (!component.isValid()) return;
        var newBtn =
          document.querySelector('li[data-target-selection-name="sfdc:StandardButton.Account.New"] a') ||
          document.querySelector('a.forceActionLink[title="New"]') ||
          document.querySelector('a[title="New"]');
        if (newBtn) {
          newBtn.addEventListener(
            "click",
            function (e) {
              e.stopImmediatePropagation();
              e.preventDefault();
              self.openNewAccountModal(component);
            },
            true
          );
        } else {
          self.interceptNewButton(component, count + 1);
        }
      }),
      300
    );
  }
})
