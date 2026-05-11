({
  loadPinnedFilter: function (component) {
    var pinned = localStorage.getItem("accountListView_pinnedFilter");
    if (pinned) {
      component.set("v.listFilterName", pinned);
    }
  },

  savePinnedFilter: function (value) {
    localStorage.setItem("accountListView_pinnedFilter", value);
  },

  fetchListViews: function (component) {
    var action = component.get("c.getAccountListViews");
    action.setCallback(this, function (response) {
      if (response.getState() === "SUCCESS") {
        component.set("v.listViews", response.getReturnValue());
      }
    });
    $A.enqueueAction(action);
  },

  interceptNewButton: function (component) {
    var self = this;
    window.setTimeout(
      $A.getCallback(function () {
        if (!component.isValid()) return;
        var el = component.getElement();
        if (!el) return;
        var newBtn = el.querySelector('a[title="New"]');
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
          self.interceptNewButton(component);
        }
      }),
      1500
    );
  },

  setupListViewPicker: function (component, retryCount) {
    var self = this;
    var count = retryCount || 0;
    if (count > 10) return;
    window.setTimeout(
      $A.getCallback(function () {
        if (!component.isValid()) return;
        var el = component.getElement();
        if (!el) return;
        var titleLink =
          el.querySelector(".listViewTitle a.test-drillin") ||
          el.querySelector("h2.listViewTitle a") ||
          el.querySelector(".listViewTitle a");
        if (titleLink) {
          titleLink.style.cursor = "pointer";
          var parent = titleLink.parentElement || titleLink;
          if (!parent.querySelector(".lv-arrow")) {
            var ns = "http://www.w3.org/2000/svg";
            var arrowWrap = document.createElement("span");
            arrowWrap.className = "lv-arrow";
            arrowWrap.style.marginLeft = "0.5rem";
            arrowWrap.style.display = "inline-flex";
            arrowWrap.style.verticalAlign = "middle";
            var arrowSvg = document.createElementNS(ns, "svg");
            arrowSvg.setAttribute("width", "12");
            arrowSvg.setAttribute("height", "12");
            arrowSvg.setAttribute("viewBox", "0 0 520 520");
            var arrowPath = document.createElementNS(ns, "path");
            arrowPath.setAttribute("fill", "#181818");
            arrowPath.setAttribute(
              "d",
              "M83 140h354c10 0 17 13 9 22L273 374c-6 8-19 8-25 0L73 162c-7-9-1-22 10-22"
            );
            arrowSvg.appendChild(arrowPath);
            arrowWrap.appendChild(arrowSvg);
            titleLink.appendChild(arrowWrap);
          }
          var titleParent = titleLink.parentElement || titleLink;
          if (!titleParent.querySelector(".lv-pin")) {
            var currentFilter = component.get("v.listFilterName");
            var pinnedFilter = localStorage.getItem("accountListView_pinnedFilter");
            var isPinned = currentFilter === pinnedFilter;
            var pinBtn = document.createElement("button");
            pinBtn.className = "lv-pin";
            pinBtn.style.background = "#fff";
            pinBtn.style.border = "1px solid #c9c9c9";
            pinBtn.style.borderRadius = "0.25rem";
            pinBtn.style.cursor = "pointer";
            pinBtn.style.marginLeft = "0.75rem";
            pinBtn.style.padding = "0.35rem";
            pinBtn.style.verticalAlign = "middle";
            pinBtn.style.display = "inline-flex";
            pinBtn.style.alignItems = "center";
            pinBtn.style.justifyContent = "center";
            self.updatePinState(pinBtn, isPinned);
            pinBtn.addEventListener("click", function (e) {
              e.stopImmediatePropagation();
              e.preventDefault();
              e.stopPropagation();
              var filter = component.get("v.listFilterName");
              self.savePinnedFilter(filter);
              self.updatePinState(pinBtn, true);
              var toastEvent = $A.get("e.force:showToast");
              if (toastEvent) {
                toastEvent.setParams({
                  title: "Pinned",
                  message: "List view pinned as default.",
                  type: "success"
                });
                toastEvent.fire();
              }
            });
            titleParent.appendChild(pinBtn);
          }

          titleLink.addEventListener(
            "click",
            function (e) {
              e.stopImmediatePropagation();
              e.preventDefault();
              e.stopPropagation();
              self.toggleDropdown(component, titleLink);
              return false;
            },
            true
          );
        } else {
          self.setupListViewPicker(component, count + 1);
        }
      }),
      1500
    );
  },

  toggleDropdown: function (component, anchorEl) {
    var existing = document.getElementById("custom-lv-dropdown");
    if (existing) {
      existing.remove();
      return;
    }

    var listViews = component.get("v.listViews");
    if (!listViews || listViews.length === 0) {
      console.warn("AccountListView: No list views loaded yet");
      return;
    }

    var currentFilter = component.get("v.listFilterName");
    var self = this;
    var rect = anchorEl.getBoundingClientRect();

    var dropdown = document.createElement("div");
    dropdown.id = "custom-lv-dropdown";
    dropdown.style.position = "fixed";
    dropdown.style.top = rect.bottom + "px";
    dropdown.style.left = rect.left + "px";
    dropdown.style.zIndex = "99999";
    dropdown.style.minWidth = "15rem";
    dropdown.style.maxHeight = "20rem";
    dropdown.style.overflowY = "auto";
    dropdown.style.backgroundColor = "#fff";
    dropdown.style.border = "1px solid #d8dde6";
    dropdown.style.borderRadius = "0.25rem";
    dropdown.style.boxShadow = "0 2px 3px rgba(0,0,0,0.16)";

    var ul = document.createElement("ul");
    ul.style.listStyle = "none";
    ul.style.margin = "0";
    ul.style.padding = "0.25rem 0";

    listViews.forEach(function (lv) {
      var li = document.createElement("li");

      var a = document.createElement("a");
      a.href = "javascript:void(0)";
      a.style.display = "flex";
      a.style.alignItems = "center";
      a.style.padding = "0.5rem 0.75rem";
      a.style.textDecoration = "none";
      a.style.color = "#181818";
      a.style.cursor = "pointer";

      a.addEventListener("mouseenter", function () {
        a.style.backgroundColor = "#f3f3f3";
      });
      a.addEventListener("mouseleave", function () {
        a.style.backgroundColor = "transparent";
      });

      var check = document.createElement("span");
      check.style.width = "1rem";
      check.style.marginRight = "0.5rem";
      check.style.color = "#0070d2";
      check.style.fontWeight = "bold";
      if (lv.value === currentFilter) {
        check.textContent = "\u2713";
      }
      a.appendChild(check);

      var span = document.createElement("span");
      span.textContent = lv.label;
      span.title = lv.label;
      a.appendChild(span);

      li.appendChild(a);

      a.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        dropdown.remove();
        self.switchListView(component, lv.value);
      });

      ul.appendChild(li);
    });

    dropdown.appendChild(ul);
    document.body.appendChild(dropdown);

    var closeHandler = function (e) {
      if (!dropdown.contains(e.target)) {
        dropdown.remove();
        document.removeEventListener("click", closeHandler);
      }
    };
    window.setTimeout(function () {
      document.addEventListener("click", closeHandler);
    }, 100);
  },

  switchListView: function (component, value) {
    component.set("v.listFilterName", value);
    component.set("v.listViewReady", false);
    var self = this;
    window.setTimeout(
      $A.getCallback(function () {
        if (!component.isValid()) return;
        component.set("v.listViewReady", true);
        self.interceptNewButton(component);
        self.setupListViewPicker(component);
      }),
      0
    );
  },

  updatePinState: function (pinBtn, isPinned) {
    var ns = "http://www.w3.org/2000/svg";
    while (pinBtn.firstChild) {
      pinBtn.removeChild(pinBtn.firstChild);
    }
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("viewBox", "0 0 16 16");
    var path = document.createElementNS(ns, "path");
    svg.setAttribute("viewBox", "0 0 520 520");
    if (isPinned) {
      path.setAttribute("fill", "#0070d2");
      path.setAttribute(
        "d",
        "M369 237h-5L330 79h9a29 29 0 000-58H181a29 29 0 000 58h9l-33 158h-5a29 29 0 000 58h84v174c0 16 13 30 30 30s30-13 30-30V296h74c16 0 29-13 29-29s-14-30-30-30"
      );
    } else {
      path.setAttribute("fill", "#706e6b");
      path.setAttribute(
        "d",
        "M495 154L360 19c-14-14-36-14-50 0s-14 36 0 50l7 7-162 107-5-5c-14-14-36-14-50 0s-14 36 0 50l72 72L24 448a36 36 0 000 51 36 36 0 0051 0l148-149 63 63a35 35 0 0050 0 35 35 0 000-50l-5-5 106-163 7 7a35 35 0 0050 0c14-12 14-34 1-48"
      );
    }
    svg.appendChild(path);
    pinBtn.appendChild(svg);
    pinBtn.title = isPinned ? "This list view is pinned" : "Pin this list view";
    pinBtn.style.opacity = isPinned ? "1" : "0.5";
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
            "AccountListView createComponent failed:",
            status,
            errorMessage
          );
        }
      }
    );
  }
})
