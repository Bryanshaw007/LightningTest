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

  getRecentFilters: function () {
    var stored = localStorage.getItem("accountListView_recentFilters");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
    return [];
  },

  addRecentFilter: function (value) {
    var recent = this.getRecentFilters();
    var idx = recent.indexOf(value);
    if (idx !== -1) {
      recent.splice(idx, 1);
    }
    recent.unshift(value);
    if (recent.length > 5) {
      recent = recent.slice(0, 5);
    }
    localStorage.setItem("accountListView_recentFilters", JSON.stringify(recent));
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

  interceptNewButton: function (component, retryCount) {
    var self = this;
    var count = retryCount || 0;
    if (count > 30) return;
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
          self.interceptNewButton(component, count + 1);
        }
      }),
      200
    );
  },

  setupListViewPicker: function (component, retryCount) {
    var self = this;
    var count = retryCount || 0;
    if (count > 30) return;
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
          self.removeTransitionOverlay();
        } else {
          self.setupListViewPicker(component, count + 1);
        }
      }),
      200
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
    var pinnedFilter = localStorage.getItem("accountListView_pinnedFilter");
    var self = this;
    var rect = anchorEl.getBoundingClientRect();

    var dropdown = document.createElement("div");
    dropdown.id = "custom-lv-dropdown";
    dropdown.style.position = "fixed";
    dropdown.style.top = rect.bottom + "px";
    dropdown.style.left = rect.left + "px";
    dropdown.style.zIndex = "99999";
    dropdown.style.minWidth = "20rem";
    dropdown.style.maxHeight = "24rem";
    dropdown.style.overflowY = "auto";
    dropdown.style.backgroundColor = "#fff";
    dropdown.style.border = "1px solid #d8dde6";
    dropdown.style.borderRadius = "0.25rem";
    dropdown.style.boxShadow = "0 2px 3px rgba(0,0,0,0.16)";

    // Search box
    var searchWrap = document.createElement("div");
    searchWrap.style.padding = "0.5rem 0.75rem";
    searchWrap.style.borderBottom = "1px solid #e5e5e5";
    searchWrap.style.position = "relative";
    var searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search lists...";
    searchInput.style.width = "100%";
    searchInput.style.padding = "0.4rem 2rem 0.4rem 0.5rem";
    searchInput.style.border = "1px solid #d8dde6";
    searchInput.style.borderRadius = "0.25rem";
    searchInput.style.fontSize = "0.875rem";
    searchInput.style.outline = "none";
    searchInput.style.boxSizing = "border-box";
    searchInput.addEventListener("focus", function () {
      searchInput.style.borderColor = "#0070d2";
      searchInput.style.boxShadow = "0 0 3px #0070d2";
    });
    searchInput.addEventListener("blur", function () {
      searchInput.style.borderColor = "#d8dde6";
      searchInput.style.boxShadow = "none";
    });
    // Search icon
    var ns = "http://www.w3.org/2000/svg";
    var searchIcon = document.createElementNS(ns, "svg");
    searchIcon.setAttribute("width", "14");
    searchIcon.setAttribute("height", "14");
    searchIcon.setAttribute("viewBox", "0 0 520 520");
    searchIcon.style.position = "absolute";
    searchIcon.style.right = "1.25rem";
    searchIcon.style.top = "50%";
    searchIcon.style.transform = "translateY(-50%)";
    var searchPath = document.createElementNS(ns, "path");
    searchPath.setAttribute("fill", "#706e6b");
    searchPath.setAttribute(
      "d",
      "M484 442L361 319c20-30 32-66 32-105C393 118 313 38 217 38S41 118 41 214s80 176 176 176c39 0 75-12 105-32l123 123c6 6 14 9 20 9s14-3 20-9c11-11 11-28-1-39zM217 333c-66 0-119-54-119-119S151 95 217 95s119 54 119 119-54 119-119 119z"
    );
    searchIcon.appendChild(searchPath);
    searchWrap.appendChild(searchInput);
    searchWrap.appendChild(searchIcon);
    dropdown.appendChild(searchWrap);

    // List container
    var listContainer = document.createElement("div");

    var buildList = function (filterText) {
      while (listContainer.firstChild) {
        listContainer.removeChild(listContainer.firstChild);
      }
      var filtered = listViews.filter(function (lv) {
        if (!filterText) return true;
        return lv.label.toLowerCase().indexOf(filterText.toLowerCase()) !== -1;
      });

      // Split into recent and others
      var recentValues = self.getRecentFilters();
      var recentSet = {};
      recentValues.forEach(function (v) { recentSet[v] = true; });
      if (pinnedFilter) recentSet[pinnedFilter] = true;
      var recentItems = [];
      var otherItems = [];
      // Add pinned first if it exists in filtered
      filtered.forEach(function (lv) {
        if (lv.value === pinnedFilter) {
          recentItems.unshift(lv);
        } else if (recentSet[lv.value]) {
          recentItems.push(lv);
        } else {
          otherItems.push(lv);
        }
      });

      // Recent List Views section
      if (recentItems.length > 0) {
        var recentHeader = document.createElement("div");
        recentHeader.style.padding = "0.5rem 0.75rem 0.25rem";
        recentHeader.style.fontSize = "0.75rem";
        recentHeader.style.fontWeight = "bold";
        recentHeader.style.color = "#181818";
        recentHeader.textContent = "Recent List Views";
        listContainer.appendChild(recentHeader);
        recentItems.forEach(function (lv) {
          listContainer.appendChild(
            self.createListViewItem(lv, currentFilter, pinnedFilter, dropdown, component)
          );
        });
      }

      // All Other Lists section
      if (otherItems.length > 0) {
        var otherHeader = document.createElement("div");
        otherHeader.style.padding = "0.5rem 0.75rem 0.25rem";
        otherHeader.style.fontSize = "0.75rem";
        otherHeader.style.fontWeight = "bold";
        otherHeader.style.color = "#181818";
        otherHeader.textContent = "All Other Lists";
        listContainer.appendChild(otherHeader);
        otherItems.forEach(function (lv) {
          listContainer.appendChild(
            self.createListViewItem(lv, currentFilter, pinnedFilter, dropdown, component)
          );
        });
      }

      if (filtered.length === 0) {
        var noResult = document.createElement("div");
        noResult.style.padding = "0.75rem";
        noResult.style.color = "#706e6b";
        noResult.style.textAlign = "center";
        noResult.textContent = "No lists found.";
        listContainer.appendChild(noResult);
      }
    };

    buildList("");
    searchInput.addEventListener("input", function () {
      buildList(searchInput.value);
    });

    dropdown.appendChild(listContainer);
    document.body.appendChild(dropdown);
    searchInput.focus();

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

  createListViewItem: function (lv, currentFilter, pinnedFilter, dropdown, component) {
    var self = this;
    var li = document.createElement("div");
    var a = document.createElement("a");
    a.href = "javascript:void(0)";
    a.style.display = "flex";
    a.style.alignItems = "center";
    a.style.padding = "0.5rem 0.75rem";
    a.style.textDecoration = "none";
    a.style.color = "#181818";
    a.style.cursor = "pointer";

    if (lv.value === currentFilter) {
      a.style.backgroundColor = "#f0f6ff";
      a.style.outline = "2px solid #0070d2";
      a.style.outlineOffset = "-2px";
    }

    a.addEventListener("mouseenter", function () {
      if (lv.value !== currentFilter) a.style.backgroundColor = "#f3f3f3";
    });
    a.addEventListener("mouseleave", function () {
      a.style.backgroundColor = lv.value === currentFilter ? "#f0f6ff" : "transparent";
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

    var label = lv.label;
    if (lv.value === pinnedFilter) {
      label += " (Pinned list)";
    }
    var span = document.createElement("span");
    span.textContent = label;
    span.title = label;
    a.appendChild(span);

    li.appendChild(a);

    a.addEventListener("click", function (e) {
      e.stopPropagation();
      e.preventDefault();
      dropdown.remove();
      self.switchListView(component, lv.value);
    });

    return li;
  },

  showTransitionOverlay: function (component) {
    var existing = document.getElementById("lv-transition-overlay");
    if (existing) return;
    var el = component.getElement();
    if (!el) return;
    var rect = el.getBoundingClientRect();
    var overlay = document.createElement("div");
    overlay.id = "lv-transition-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = rect.top + "px";
    overlay.style.left = rect.left + "px";
    overlay.style.width = rect.width + "px";
    overlay.style.height = "100px";
    overlay.style.zIndex = "99999";
    overlay.style.cursor = "default";
    document.body.appendChild(overlay);
  },

  removeTransitionOverlay: function () {
    var overlay = document.getElementById("lv-transition-overlay");
    if (overlay) overlay.remove();
  },

  switchListView: function (component, value) {
    this.addRecentFilter(value);
    this.showTransitionOverlay(component);
    component.set("v.listFilterName", value);
    component.set("v.listViewReady", false);
    var self = this;
    window.setTimeout(
      $A.getCallback(function () {
        if (!component.isValid()) return;
        component.set("v.listViewReady", true);
        self.interceptNewButton(component);
        self.setupListViewPicker(component);
        self.interceptGearButton(component);
      }),
      0
    );
  },

  interceptGearButton: function (component, retryCount) {
    var count = retryCount || 0;
    if (count > 30) return;
    var self = this;
    window.setTimeout(
      $A.getCallback(function () {
        if (!component.isValid()) return;
        var el = component.getElement();
        if (!el) return;
        var gearBtn = el.querySelector('button[title="List View Controls"]');
        if (gearBtn) {
          gearBtn.addEventListener(
            "click",
            function (e) {
              e.stopImmediatePropagation();
              e.preventDefault();
              var filter = component.get("v.listFilterName") || "Recent";
              window.open("/lightning/o/Account/list?filterName=" + filter, "_blank");
            },
            true
          );
        } else {
          self.interceptGearButton(component, count + 1);
        }
      }),
      200
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
    pinBtn.title = isPinned ? "This list is pinned." : "Pin this list view.";
    pinBtn.style.opacity = isPinned ? "1" : "0.5";

    var tipText = isPinned
      ? "To unpin, pin another list view."
      : "This list is not currently pinned.";
    pinBtn._lvPinTipText = tipText;
    if (!pinBtn._lvPinTipBound) {
      pinBtn._lvPinTipBound = true;
      pinBtn.addEventListener("mouseenter", function () {
        var existing = document.getElementById("lv-pin-tooltip");
        if (existing) existing.remove();
        var rect = pinBtn.getBoundingClientRect();
        var tooltip = document.createElement("div");
        tooltip.id = "lv-pin-tooltip";
        tooltip.textContent = pinBtn._lvPinTipText;
        tooltip.style.position = "fixed";
        tooltip.style.zIndex = "99999";
        tooltip.style.backgroundColor = "#16325c";
        tooltip.style.color = "#fff";
        tooltip.style.padding = "0.4rem 0.6rem";
        tooltip.style.borderRadius = "0.25rem";
        tooltip.style.fontSize = "0.75rem";
        tooltip.style.whiteSpace = "nowrap";
        tooltip.style.pointerEvents = "none";
        var arrow = document.createElement("div");
        arrow.style.position = "absolute";
        arrow.style.top = "100%";
        arrow.style.left = "6px";
        arrow.style.width = "0";
        arrow.style.height = "0";
        arrow.style.borderLeft = "6px solid transparent";
        arrow.style.borderRight = "6px solid transparent";
        arrow.style.borderTop = "6px solid #16325c";
        tooltip.appendChild(arrow);
        document.body.appendChild(tooltip);
        var pinCenter = rect.left + rect.width / 2;
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 8) + "px";
        tooltip.style.left = (pinCenter - 12) + "px";
      });
      pinBtn.addEventListener("mouseleave", function () {
        var tip = document.getElementById("lv-pin-tooltip");
        if (tip) tip.remove();
      });
    }
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
