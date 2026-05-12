({
  doInit: function (component, event, helper) {
    var pageRef = component.get("v.pageReference");
    if (pageRef && pageRef.state && pageRef.state.c__filterName) {
      component.set("v.listFilterName", pageRef.state.c__filterName);
    }
    helper.openNewAccountModal(component);
    helper.interceptNewButton(component);
  }
})
