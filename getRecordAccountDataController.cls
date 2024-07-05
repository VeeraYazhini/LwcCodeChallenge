//veera coding challenge
public with sharing class getRecordAccountDataController {
 //@AuraEnabled is annotation enables LWC to access below apex method
 //(cacheable=true) is for caching the data on client side storage without 
  // waiting for server trips. Which imporves the performance
 @AuraEnabled(cacheable=true)
  public static List<Account> getAccounts(String filterval) {
    String val1='%'+filterval+'%';
  return [SELECT  Id, Name, Owner.Name,Phone , website,AnnualRevenue FROM Account where Industry='Financial Services' and Name like :val1];
  }
 
}