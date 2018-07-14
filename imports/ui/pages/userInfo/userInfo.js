import './userInfo.html'

import { Template } from 'meteor/templating'
import { UserQuestions } from '/imports/api/userQuestions/userQuestions'

import { AutoForm } from 'meteor/aldeed:autoform'
import { notify } from '/imports/modules/notifier'

Template.userInfo.onCreated(function() {
	window.UserQuestions = UserQuestions
})

AutoForm.addHooks(['userQuestionsForm'], {
	onError: (_formType, error) => {
		notify('Failed to save questions!', 'error')
	},
	after: {
    	method: (error, _result) => {
      		if (error) {
				notify(err.message, 'error')
      		} else {
				notify('Inserted successfully.', 'success')
      		}
    	}
  	}
})