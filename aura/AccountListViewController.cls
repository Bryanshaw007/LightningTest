public with sharing class AccountListViewController {
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getAccountListViews() {
        List<Map<String, String>> result = new List<Map<String, String>>();
        for (ListView lv : [SELECT Id, DeveloperName, Name FROM ListView WHERE SobjectType = 'Account' ORDER BY Name]) {
            Map<String, String> item = new Map<String, String>();
            item.put('label', lv.Name);
            item.put('value', lv.DeveloperName);
            result.add(item);
        }
        return result;
    }
}
