import './new.html'
import './new.scss'

import { Template } from "meteor/templating"
import { FlowRouter } from 'meteor/kadira:flow-router'
import { ProjectQuestions } from '/imports/api/project-questions/project-questions'
import { FormProgress } from '/imports/api/form-progress/form-progress'
import { saveProjectQuestions } from '/imports/api/project-questions/methods'
import { calculateFormRating } from '/imports/api/form-progress/methods'

// import { AutoForm } from 'meteor/aldeed:autoform'
import { notify } from '/imports/modules/notifier'
import swal from 'sweetalert'
import { redirectToUserInfoIfNeeded } from '../../redirectionModalHelper';

const BC_REQUIRE_RSN = 'blockchain_requirement_reason';
const BC_USE_RSN = 'blockchain_use_reason';

Template.newApplication.onCreated(function() {
    window.ProjectQuestions = ProjectQuestions
    this.projectID = () => FlowRouter.getParam("projectID")

    this.autorun(() => {
        this.subscribe('projectQuestions', FlowRouter.getParam("projectID"))
        this.subscribe('formProgress')

        //if an application exists redirect instead of creating a new one
        let applicationExist = FormProgress.findOne({ 'status': 'in-progress', form_type: 'project' })
        if (applicationExist) {
            FlowRouter.go('/applications/' + applicationExist.form_type_id)
        }
	})
	
	redirectToUserInfoIfNeeded(this);
})

Template.newApplication.onRendered(function() {
	this.autorun(() => {
		$('textarea[name=' + BC_USE_RSN + ']').parent().hide()
		$('textarea[name=' + BC_REQUIRE_RSN + ']').parent().hide()

		const wizard = Wizard.get('basic-wizard');
		this.wizard = wizard;

		const progress = FormProgress.findOne({ 'form_type_id' : FlowRouter.getParam("projectID")  })
		if (progress !== undefined) {
			const project = ProjectQuestions.findOne({ '_id' : FlowRouter.getParam("projectID") })
			
			for (let i = 0; i < wizard.steps.length; i++) {
				const step = wizard.steps[i];

				const stepData = {}
				const schemaKeys = step.schema._schemaKeys

				for (let j = 0; j < schemaKeys.length; j++) {
					const schemaKey = schemaKeys[j];
					stepData[schemaKey] = project[schemaKey]
				}

				wizard.setData(step.id, stepData)
			}
			wizard.show(progress.next_step)
		}
		
	})
})

Template.newApplication.destroyed = function() {
	this.wizard.clearData();
	this.wizard.destroy();
};

Template.newApplication.helpers({
	steps() {
		return [{
			id: 'stepOne',
			title: 'Step One',
			formId: 'stepOne', 
			schema: ProjectQuestions.schema.pick(
				'problem_description',
				'possible_solution',
				'proposed_solution',
				'attempted_solution'
			),
		}, {
			id: 'stepTwo',
			title: 'Step Two',
			formId: 'stepTwo',
			schema: ProjectQuestions.schema.pick(
				'is_solvable_by_traditional_db',
				'blockchain_use_reason',
				'blockchain_requirement_reason',
				'blockchain_solution_proposal',
				'ada_blockchain_aspects',
				'target_market_size',
				'target_market_regions'
			),
		}, {
			id: 'stepThree',
			title: 'Step Three',
			formId: 'stepThree',
			schema: ProjectQuestions.schema.pick(
				'competitors',
				'target_audience',
				'prototype',
				'source_code_url',
				'development_roadmap',
				'project_website',
				'business_plan'
			),
		}, {
			id: 'stepFour',
			title: 'Step Four',
			formId: 'stepFour',
			schema: ProjectQuestions.schema.pick(
				'disruptive_solution_reason',
				'user_onboarding_process',
				'project_token_type',
				'unfair_advantage_reason',
				'team_members'
			),
		}]
	}
})


Template.newApplication.events({
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
		
		const projectID = tpl.projectID() === undefined ? 'new' : tpl.projectID()

		// Construct progress info
		const wizard = Wizard.get('basic-wizard');
		const activeStep = wizard.activeStep();
		let steps = {
			last: wizard.getStep(wizard.indexOf(activeStep.id)-1).id,
			next: activeStep.id,
			final: false,
		};

		saveProjectQuestions.call({ projectID: projectID, data: {[targetKey]: value}, steps: steps}, (err, resp) => {
			formGroup.removeClass('autosave-changed');
			if (!err) {
				if (projectID !== resp) FlowRouter.setParams({projectID: resp});
				formGroup.addClass('autosave-saved');
			} else {
				formGroup.addClass('autosave-failed');
				AutoForm.getValidationContext(formId).addValidationErrors([err])
			}
		});	
	},
	/*
		when click on back-button using default js function scroll to top.
	 */
	'click .wizard-back-button' (event, _tpl) {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	},
	'submit' (event, tpl) {
		event.preventDefault();
		const formGroup = $(event.target).closest('.form-group');

		formGroup.removeClass('autosave-saved');
		formGroup.removeClass('autosave-failed');
		formGroup.addClass('autosave-changed');

		const projectID = tpl.projectID() === undefined ? 'new' : tpl.projectID()

		// Construct progress info
		const wizard = Wizard.get('basic-wizard');
		const activeStep = wizard.activeStep();
		let steps = {
			last: wizard.getStep(wizard.indexOf(wizard.activeStep().id)-1).id,
			next: activeStep.id,
			final: $(event.target).find('.wizard-submit-button').length >= 1,
		};
		// When single step submitted, srcoll to top using following.
		window.scrollTo({ top: 0, behavior: 'smooth' });

		saveProjectQuestions.call({ projectID: projectID, data: wizard.mergedData(), steps: steps }, (err, resp) => {
	    if (!err) {
	        if (projectID !== resp) FlowRouter.setParams({ projectID: resp });

	        if (steps.final) {
	            tpl.wizard.clearData();
	            tpl.wizard.destroy();
	            FlowRouter.go('/');

	            // Calculate the weight of the application when saved
	            calculateFormRating.call({
	                applicationId: projectID
	            }, (err, data) => {

	                if (err) {
	                    console.error(err)
	                }
	            })

	            swal({
	                text: `Application has been received! You will now be directed to answer questions about yourself.`,
	                icon: 'success',
	                buttons: {
	                    confirm: {
	                        text: 'OK',
	                        value: true,
	                        visible: true,
	                        closeModal: true
	                    }
	                }
	            }).then(confirmed => {
	                FlowRouter.go('/userInfo')
	            });
	        }
	    } else {
	        AutoForm.getValidationContext(formId).addValidationErrors([err])
	    }
	});
	},
	'change input[type=radio][name=is_solvable_by_traditional_db]' (event, _tpl) {
		event.preventDefault()
		switch (event.currentTarget.value) {
			case "Yes":
				$('textarea[name=' + BC_USE_RSN + ']').parent().show()
				$('textarea[name=' + BC_REQUIRE_RSN + ']').parent().hide()
				break;
			case "No":
				$('textarea[name=' + BC_USE_RSN + ']').parent().hide()
				$('textarea[name=' + BC_REQUIRE_RSN + ']').parent().show()
				break;
			default:
				$('textarea[name=' + BC_USE_RSN + ']').parent().hide()
				$('textarea[name=' + BC_REQUIRE_RSN + ']').parent().hide()
				
		}
	}
})