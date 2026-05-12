({
  handleSuccess: function (component) {
    component.find("overlayLib").notifyClose();
    var toastEvent = $A.get("e.force:showToast");
    toastEvent.setParams({
      title: "Success",
      message: "Account created successfully.",
      type: "success"
    });
    toastEvent.fire();
    $A.get("e.force:refreshView").fire();
  },

  handleCancel: function (component) {
    component.find("overlayLib").notifyClose();
  }
});
