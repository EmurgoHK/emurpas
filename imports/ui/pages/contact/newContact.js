import './newContact.html'

import { Template } from 'meteor/templating'
import { FlowRouter } from 'meteor/kadira:flow-router'

import { Contact } from '/imports/api/contact/contact'
import { notify } from '/imports/modules/notifier'

import { newContact } from '/imports/api/contact/methods'

const maxCharValue = (inputId) => {
  	if (inputId === 'title') {
    	return 100
  	}
}
Template.newContact.helpers({
	isNotLoggedIn: function() {
		let flag = Meteor.userId() ? false : true;
    	return flag;
    },
})

Template.newContact.events({
	'keyup #title': (event, templateInstance) => {
        event.preventDefault()

        let inputId = event.target.id
        let inputValue = event.target.value
        let inputMaxChars = maxCharValue(inputId) - parseInt(inputValue.length)
        let charsLeftText = `${inputMaxChars} characters left`

        $(`#${inputId}-chars`).text(charsLeftText)

        let specialCodes = [8, 46, 37, 39] // backspace, delete, left, right

        if (inputMaxChars <= 0) {
          	$(`#${inputId}`).keypress((e) => { return !!~specialCodes.indexOf(e.keyCode) })
          	return true
        }
        // Remove validation error, if exists
        $(`#${inputId}`).removeClass('is-invalid')
        $(`#${inputId}`).unbind('keypress')
    },
    'click .new-contact': (event, templateInstance) => {
		event.preventDefault()

	    newContact.call({
	    	title: $('#title').val(),
	    	body: $('#body').val(),
	    	email: $('#email').val()
	    }, (err, data) => {
	    	if (!err) {
	    		notify('Your request has been saved.', 'success')
	        	FlowRouter.go('/contact')
	        	return
	      	}

		    if (err.details && err.details.length >= 1) {
		       	err.details.forEach(e => {
		       		$(`#${e.name}`).addClass('is-invalid')
		       		$(`#${e.name}Error`).show()
		       		$(`#${e.name}Error`).text(e.message)
		      	})
		    }
	    })
	}
})
