({
  doInit: function (component, event, helper) {
    helper.loadPinnedFilter(component);
    helper.fetchListViews(component);
    helper.interceptNewButton(component);
    helper.setupListViewPicker(component);
  }
})
