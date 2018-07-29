import './new.html'
import { Template } from "meteor/templating"
import { ProjectQuestions } from '/imports/api/project-questions/project-questions'
import { AutoForm } from 'meteor/aldeed:autoform'
import { notify } from '/imports/modules/notifier'

const FIELDS_TO_OMIT = 'blockchain_use_reason,blockchain_requirement_reason';
const BC_REQUIRE_RSN = 'blockchain_requirement_reason';
const BC_USE_RSN = 'blockchain_use_reason';

Template.newApplication.onCreated(function() {
	window.ProjectQuestions = ProjectQuestions
	this.fieldsToOmit = new ReactiveVar(FIELDS_TO_OMIT)
})

Template.newApplication.helpers({
	fieldsToOmit() {
		return Template.instance().fieldsToOmit.get();
	}
})

Template.newApplication.events({
	'change input[type=radio][name=is_solvable_by_traditional_db]' (event, templateInstance) {
		event.preventDefault()

		switch (event.currentTarget.value) {
			case "true":
				templateInstance.fieldsToOmit.set(BC_REQUIRE_RSN)
				break;
			case "false":
				templateInstance.fieldsToOmit.set(BC_USE_RSN)
				break;
			default:
				templateInstance.fieldsToOmit.set(FIELDS_TO_OMIT)
		}
	}
})

// using AutoForm hooks, we can control error validation on the UI
AutoForm.addHooks(['projectQuestionsForm'], { // add some primitive error handling here
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