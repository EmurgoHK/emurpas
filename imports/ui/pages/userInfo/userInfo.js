import './userInfo.html'

import { Template } from 'meteor/templating'
import { UserQuestions } from '/imports/api/userQuestions/userQuestions'
import { FormProgress } from '/imports/api/form-progress/form-progress'
import { addUserInfo } from '/imports/api/userQuestions/methods'

import { AutoForm } from 'meteor/aldeed:autoform'
import { notify } from '/imports/modules/notifier'

Template.userInfo.onCreated(function() {
	window.UserQuestions = UserQuestions
	this.userInfoID = () => FlowRouter.getParam("userInfoID")

	this.autorun(() => {
		this.subscribe('userQuestions', FlowRouter.getParam("userInfoID"))
		this.subscribe('formProgress', FlowRouter.getParam("userInfoID"))
	})
})

Template.userInfo.onRendered(function() {
	this.autorun(() => {
		const wizard = Wizard.get('user-info-wizard');
		this.wizard = wizard;

		const progress = FormProgress.findOne({ 'form_type_id' : FlowRouter.getParam("userInfoID")  })

		if (progress !== undefined) {
			const userInfo = UserQuestions.findOne({ '_id' : FlowRouter.getParam("userInfoID") })
			
			for (let i = 0; i < wizard.steps.length; i++) {
				const step = wizard.steps[i];
				if (step.id === progress.next_step) break;

				const stepData = {}
				const schemaKeys = step.schema._schemaKeys

				for (let j = 0; j < schemaKeys.length; j++) {
					const schemaKey = schemaKeys[j];
					stepData[schemaKey] = userInfo[schemaKey]
				}

				wizard.setData(step.id, stepData)
			}

			wizard.show(progress.next_step)
		}
		
	})
})

Template.userInfo.helpers({
	steps() {
		return [{
			id: 'stepOne',
			title: 'Step One',
			formId: 'stepOne', 
			schema: UserQuestions.schema.pick(
				'fullName',
				'dob',
				'country',
				'github',
				'reason'
			),
		}, {
			id: 'stepTwo',
			title: 'Step Two',
			formId: 'stepTwo', 
			schema: UserQuestions.schema.pick(
				'teamDescription',
				'averageTeamWorkday',
				'timeCommitment',
				'personalInvestment'
			),
		}, {
			id: 'stepThree',
			title: 'Step Three',
			formId: 'stepThree', 
			schema: UserQuestions.schema.pick(
				'relatedPastProjects',
				'projectGoals',
				'likedBlockchainProjects',
				'employmentStatus'
			),
		}]
	}
})

Template.userInfo.events({
	'submit' (event, tpl) {
		event.preventDefault();

		let activeStep = tpl.wizard.activeStep()
		let userInfoID = tpl.userInfoID() === undefined ? 'new' : tpl.userInfoID()

		let steps = {}
		let lastStep = activeStep.wizard._stepsByIndex[activeStep.wizard.indexOf(activeStep.id)-1]
		let nextStep = activeStep.id
		let isFinalStep = false

		if ($(event.target).find('.wizard-submit-button').length >= 1) {
			isFinalStep = true
		}

		steps.last = lastStep
		steps.next = nextStep
		steps.final = isFinalStep

		addUserInfo.call({ userInfoID: userInfoID, userInfo: activeStep.wizard.mergedData(), steps: steps}, (err, resp) => {
			if (!err) {
				if (!isFinalStep) { 
					if (userInfoID !== resp)
						FlowRouter.setParams({userInfoID: resp})

					activeStep.wizard.next();
					return
				}

				tpl.wizard.clearData();
				tpl.wizard.destroy();
				notify('Application complete', 'success');
				FlowRouter.go('/');
			}
		})
		
	}
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