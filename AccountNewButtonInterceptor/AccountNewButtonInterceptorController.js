({
  doInit: function (component, event, helper) {
    console.log("AccountNewButtonInterceptor: initialized");
    helper.startUrlWatcher(component);
  }
})
