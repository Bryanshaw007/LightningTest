({
  handleSuccess: function (component, event, helper) {
    var isNew = !component.get("v.recordId");
    component.find("overlayLib").notifyClose();
    // In edit mode, parent's closeCallback handles navigation
    if (isNew) {
      helper.navigateAfterDone(component);
    }
  },

  handleCancel: function (component, event, helper) {
    component.find("overlayLib").notifyClose();
  }
});
