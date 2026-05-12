({
  startUrlWatcher: function (component) {
    if (component._urlWatcherStarted) return;
    component._urlWatcherStarted = true;
    var self = this;

    var checkPage = function () {
      if (!component.isValid()) return;
      var url = window.location.href;
      var prevUrl = component.get("v.currentUrl");

      if (url !== prevUrl) {
        component.set("v.currentUrl", url);
        console.log("AccountNewButtonInterceptor: URL changed to", url);
        if (self.isAccountListView(url)) {
          console.log("AccountNewButtonInterceptor: Account list view detected");
          self.interceptNewButton(component);
        }
      }
    };

    window.setInterval($A.getCallback(checkPage), 1000);
    checkPage();
  },

  isAccountListView: function (url) {
    return url.indexOf("/lightning/o/Account/list") !== -1;
  },

  interceptNewButton: function (component, retryCount) {
    var self = this;
    var count = retryCount || 0;
    if (count > 30) return;
    window.setTimeout(
      $A.getCallback(function () {
        if (!component.isValid()) return;
        var newBtn =
          document.querySelector(
            'li[data-target-selection-name="sfdc:StandardButton.Account.New"] a'
          ) ||
          document.querySelector('a.forceActionLink[title="New"]');

        console.log("AccountNewButtonInterceptor: searching for New button, attempt", count, "found:", !!newBtn);

        if (newBtn) {
          if (newBtn._accountIntercepted) {
            console.log("AccountNewButtonInterceptor: already intercepted");
            return;
          }
          newBtn._accountIntercepted = true;
          console.log("AccountNewButtonInterceptor: intercepting New button");

          newBtn.addEventListener(
            "click",
            function (e) {
              e.stopImmediatePropagation();
              e.preventDefault();
              console.log("AccountNewButtonInterceptor: New button clicked, opening modal");
              self.openNewAccountModal(component);
            },
            true
          );
        } else {
          self.interceptNewButton(component, count + 1);
        }
      }),
      500
    );
  },

  openNewAccountModal: function (component) {
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
            "AccountNewButtonInterceptor createComponent failed:",
            status,
            errorMessage
          );
        }
      }
    );
  }
})
