import './userInfo.html'
import './userInfo.scss'

import { Template } from 'meteor/templating'
import { UserQuestions } from '/imports/api/userQuestions/userQuestions'
import { ProjectQuestions } from '/imports/api/project-questions/project-questions'
import { FormProgress } from '/imports/api/form-progress/form-progress'
import { addUserInfo } from '/imports/api/userQuestions/methods'

import { AutoForm } from 'meteor/aldeed:autoform'
import { notify } from '/imports/modules/notifier'

Template.userInfo.onCreated(function() {
	window.UserQuestions = UserQuestions
	this.userInfoID = () => FlowRouter.getParam("userInfoID")
	this.hideWizard = new ReactiveVar(true);

	this.autorun(() => {
		this.subscribe('userInfo')
		this.subscribe('formProgress', FlowRouter.getParam("userInfoID"))
	})

	this.autorun(() => this.subscribe('projectQuestions'))
})

Template.userInfo.onRendered(function() {
	this.autorun(() => {
		if (!this.subscriptionsReady())
			return;

		const wizard = Wizard.get('user-info-wizard');
		// Get data and pass it to all steps
		const data = UserQuestions.findOne({ '_id' : FlowRouter.getParam("userInfoID") });
		for (const step of wizard.steps) {
			wizard.setData(step.id, data);
		}

		// Get progress and set the current step to the saved one
		const progress = FormProgress.findOne({ 'form_type_id' : FlowRouter.getParam("userInfoID")  })
		if (progress) {
			wizard.show(progress.next_step)
		}

		// Show the wizard
		this.hideWizard.set(false);
	})

	this.autorun(() => {
		let uq = UserQuestions.findOne({
			createdBy: Meteor.userId(),
			employmentStatus: {
				$exists: true
			}
		})

		if (uq && !FlowRouter.getParam('userInfoID')) {
			FlowRouter.redirect(`/userInfo/${uq._id}/view`) // don't allow multiple user infos
		}
	})
})

Template.userInfo.helpers({
	hideWizard: () => {
		return Template.instance().hideWizard.get();
	},
	hasNoApplication: () => {
		let user = Meteor.users.findOne({
			_id: Meteor.userId()
		});

		if (user) {
			return !ProjectQuestions.find({
				$or: [{
						createdBy: Meteor.userId(),
				}, {
						'team_members.email': ((user.emails || [])[0] || {}).address 
				}]
			}).count();
		}
	},
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
	'change form' (event, tpl) {
		event.preventDefault();
		const formGroup = $(event.target).closest('.form-group');

		formGroup.removeClass('autosave-saved');
		formGroup.removeClass('autosave-failed');
		formGroup.addClass('autosave-changed');
		
		// Get the id of the changed form and field
		const formId = event.target.form.id;
		const targetKey = formGroup.find('[data-schema-key]').data('schema-key');
		
		// If the field isn't valid by itself it shouldn't be updated (this doesn't check required, that is only check on clicking next)
		if (!AutoForm.validateField(targetKey, formId))
			return;

		// Get the value of the field through AutoForm
		const value = AutoForm.getFieldValue(targetKey, formId) || null;
		
		let userInfoID = tpl.userInfoID() === undefined ? 'new' : tpl.userInfoID()

		// Construct progress info
		const wizard = Wizard.get('user-info-wizard');
		const activeStep = wizard.activeStep();
		let steps = {
			last: wizard.getStep(wizard.indexOf(activeStep.id)-1).id,
			next: activeStep.id,
			final: false,
		};

		addUserInfo.call({ userInfoID: userInfoID, userInfo: {[targetKey]: value}, steps: steps}, (err, resp) => {
			formGroup.removeClass('autosave-changed');
			if (!err) {
				if (userInfoID !== resp) FlowRouter.setParams({userInfoID: resp})
				formGroup.addClass('autosave-saved');
			} else {
				formGroup.addClass('autosave-failed');
				AutoForm.getValidationContext(formId).addValidationErrors([err])
			}
		});	
	},
	"submit": (event, tpl) => {
		event.preventDefault();
		
		const wizard = Wizard.get('user-info-wizard');
		const activeStep =wizard.activeStep();
		let userInfoID = tpl.userInfoID() === undefined ? 'new' : tpl.userInfoID()

		let steps = {
			last: wizard.getStep(wizard.indexOf(wizard.activeStep().id)-1).id,
			next: activeStep.id,
			final: $(event.target).find('.wizard-submit-button').length >= 1,
		};

		addUserInfo.call({ userInfoID: userInfoID, userInfo: wizard.mergedData(), steps: steps}, (err, resp) => {
			if (!err) {
				if (userInfoID !== resp) FlowRouter.setParams({userInfoID: resp})
				if (steps.final) {
					wizard.clearData();
					wizard.destroy();
					notify('Application complete', 'success');
					FlowRouter.go('/');
				}
			} else {
				AutoForm.getValidationContext(formId).addValidationErrors([err])
			}
		});	
		
	}
});
