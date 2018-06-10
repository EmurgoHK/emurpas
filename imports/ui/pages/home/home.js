import './home.html'

import { ExampleCollection } from '/imports/api/example/exampleCollection'
import { newExample } from '/imports/api/example/methods'
import { AutoForm } from 'meteor/aldeed:autoform'

Template.App_home.onCreated(() => {
	window.ExampleCollection = ExampleCollection // for autoform to work, all collections used must be in window scope
})

// using AutoForm hooks, we can control error validation on the UI
AutoForm.addHooks(['newExampleForm'], { // add some primitive error handling here
	onError: (formType, error) => {
		// this is an error caused by validation mismatch
		alert(error) // we could use either noty notifications here, or inline error messages
	},
	after: {
    	method: (error, result) => {
      		if (error) {
      			// this is an error that ocurred when meteor method was being executed
        		alert(error.reason)
      		} else {
        		alert('Inserted successfully.')
      		}
    	}
  	}
})