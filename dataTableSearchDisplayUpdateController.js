import { LightningElement, track, wire,api} from 'lwc';
import getAccounts from '@salesforce/apex/getRecordAccountDataController.getAccounts';
import { refreshApex }  from '@salesforce/apex';
import { updateRecord } from "lightning/uiRecordApi";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import {NavigationMixin} from 'lightning/navigation';


const actions=[
    { label:'View Account', name:'view_account' }
    ];


export default class GetDataDisplayData extends NavigationMixin(LightningElement) {
     @track columns = [
    
          { label: 'Account Name', fieldName: 'Name' , sortable: "true" },
          { label: 'Account Owner', fieldName: 'AccountOwner', sortable: "true"},
          { label: 'Phone', fieldName: 'Phone', sortable: "true",editable: "true",type: "phone"},
          { label: 'Website', fieldName: 'Website', sortable: "true",editable: "true",type: "url"},
          { label: 'Annual Revenue', fieldName: 'AnnualRevenue',editable: "true", type:"currency"},
          {type:'action', typeAttributes:{rowActions:actions}}
          //Name, OwnerID ,Phone , website,AnnualRevenue
      ];
       data;
      
     draftValues;//inline edit draft
       @track sortBy;
    @track sortDirection;
     searchkey=''; 
     refreshdataTable;


     @wire(getAccounts, {filterval:'$searchkey'}) wiredAccounts({data,error}){
   
this.refreshdataTable=data;

            if (data) {
           // this.data = data;
            //this.error = undefined;
             this.data = data.map((acc) => {
            const accWithOwner = {...acc}; // clone the original record
            accWithOwner.AccountOwner = acc.Owner.Name; // add the new property
            return accWithOwner;
        });
 

        } else if (error) {
              console.log(error);
            this.data = undefined;
        }
     }
// get data from input
searchAccounts(event)
{
    this.searchkey=event.target.value;
}
    

    //row action to display account detail in new tab
    handleRowAction(event)
    {
        this.selectedRecordId=event.detail.row.Id;
        console.log("test here" ,this.selectedRecordId )
        //since requirement to open in new tab
        this[NavigationMixin.GenerateUrl]({
            type:'standard__recordPage',
            attributes:{
                recordId:event.detail.row.Id,
                objectApiName:'Account',
                actionName:'view'
            }
        }).then(url=>{
            window.open (url,"_blank");
        });
    }


     //Handle sort  
       handleSortAccountData(event) {       
        this.sortBy = event.detail.fieldName;       
        this.sortDirection = event.detail.sortDirection;       
        this.sortAccountData(event.detail.fieldName, event.detail.sortDirection);
    }

//Sort on any column
    sortAccountData(fieldname, direction) {
       console.log("inside sort func");
     let parseData = JSON.parse(JSON.stringify(this.data));

        let keyValue = (a) => {
            return a[fieldname];
        };

       let isReverse = direction === 'asc' ? 1: -1;

           parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : ''; 
            y = keyValue(y) ? keyValue(y) : '';
           
            return isReverse * ((x > y) - (y > x));
        });
        
        this.data = parseData;      
 //console.log("After ::"+parseData); 
    }
//Save data- inline edit
async handleSave(event) {
    // Convert datatable draft values into record objects
    console.log("save issue step 1::"+JSON.stringify(event.detail.draftValues));

    const records = event.detail.draftValues.slice().map((draftValue) => {
      const fields = Object.assign({}, draftValue);
      return { fields };
    });
  
console.log("save issue step2::"+JSON.stringify(records));
    // Clear all datatable draft values
    this.draftValues = [];

    try {
      // Update all records in parallel thanks to the UI API
      const recordUpdatePromises = records.map((record) => updateRecord(record));
      console.log("save issue 2 try:"+JSON.stringify(recordUpdatePromises));

      await Promise.all(recordUpdatePromises);

      // Report success with a toast
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Success",
          message: "Account updated",
          variant: "success",
        }),
      );

      // Display fresh data in the datatable
      await refreshApex(this.refreshdataTable);

    } catch (error) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error updating or reloading Account",
          message: error.body.message,
          variant: "error",
        }),
      );
    }
  }

    
}