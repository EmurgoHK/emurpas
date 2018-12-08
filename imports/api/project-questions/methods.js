import { ValidatedMethod } from 'meteor/mdg:validated-method'
import SimpleSchema from 'simpl-schema'

import { ProjectQuestions } from './project-questions'
import { updateFormProgress } from '../form-progress/methods'
import { ApplicationCount } from './application-count'
import { FormProgress } from '../form-progress/form-progress'

import { isModerator } from '/imports/api/user/methods'

import { sendNotification } from '/imports/api/notifications/methods'
import { calculateFormRating } from '/imports/api/form-progress/methods'

SimpleSchema.extendOptions(['autoform'])

// Auto Increment Index Number for Application ID

function uniqueIndex (indexOf) {
  var countObj = ApplicationCount.findOne({
    type: indexOf
  });
  var count = 0;
  if (countObj) {
    ApplicationCount.update({
      type: indexOf
    }, {
      $inc: {
	      count: 1
      }
    });
    count = countObj.count + 1;
  }
  else {
    ApplicationCount.insert({
      type: indexOf,
      count: 1
    });
    count = 1;
  }
  return count;
};

export const notifyApplication = (type, resId, fieldId, text) => {
	let application = ProjectQuestions.findOne({
        _id: resId
    })

    if (application) {
    	let users = Meteor.users.find({
    		'emails.address': {
    			$in: application.team_members.map(i => i.email)
    		}
    	}).fetch()

    	users.push(Meteor.users.findOne({
    		_id: application.createdBy
    	}))

    	users = users.filter(i => !!i)

    	users.forEach(i => { // notify all users associated with the application
        	sendNotification(i._id, `New question on your application (${resId}): ${text} (${fieldId})`, 'System', `/applications/${application._id}/view`)
    	})
    }
}

export const saveProjectQuestions = new ValidatedMethod({
    name: 'saveProjectQuestions',
    validate(_params) {},
    run({ projectID, data, steps }) {
        if (Meteor.isServer) {
            if (Meteor.userId()) {
                if (projectID === 'new') {
                    data.id = uniqueIndex('application')

                    // when Application create that time required to add userId,
                    // createdBy. which I don't found in database.
                    data.createdBy = Meteor.userId();
                    
                    projectID = ProjectQuestions.insert(data, { validate: false })
                } else {
                    ProjectQuestions.update({ '_id': projectID }, { $set: data })
                }
                let formId = data.id
                updateFormProgress('project', projectID, formId, steps)

                return projectID
            }
        }
    }
})

export const removeProjectQuestions = new ValidatedMethod({
	name: 'removeProjectQuestions',
	validate: new SimpleSchema({
		projectId: {
			type: String,
			optional: false
		}
	}).validator({
    	clean: true,
    	filter: false
    }),
    run({ projectId }) {
    	if (Meteor.userId() && isModerator(Meteor.userId())) {
    		ProjectQuestions.remove({
    			_id: projectId
    		})

    		FormProgress.remove({
    			form_type_id: projectId
    		})
    	} else {
    		throw new Meteor.Error('Error', 'Insufficient permissions.')
    	}
    }
})

if (Meteor.isDevelopment) {
    Meteor.methods({
    	generateTestApplication: () => {
			const index = uniqueIndex('application');
    		const id = ProjectQuestions.insert({
				createdBy: Meteor.users.findOne({})._id,
				createdAt: new Date().getTime(),
    			problem_description: 'test',
	            possible_solution: 'Test solution',
	            proposed_solution: 'Test solution 2',
	            attempted_solution: 'Test solution 3',
	            is_solvable_by_traditional_db: 'Yes',
	            blockchain_use_reason: 'Test reason',
	            blockchain_requirement_reason: 'Test reason 2',
	            blockchain_solution_proposal: 'Test proposal',
	            ada_blockchain_aspects: 'Test ada',
	            target_market_size: 'Test market size',
	            target_market_regions: 'Test market regions',
	            competitors: 'Test competitors',
	            target_audience: 'Test audience',
	            prototype: 'Test prototype',
	            source_code_url: 'Test source code URL',
	            development_roadmap: 'Test roadmap',
	            project_website: 'Test website',
	            business_plan: 'Test business plan',
	            disruptive_solution_reason: 'Test reason 5',
	            user_onboarding_process: 'User onboarding test',
	            project_token_type: 'Test token type',
	            unfair_advantage_reason: 'Test reason 6',
	            team_members: [{
	                name: 'Test user 1',
	                email: 'test@test.com'
	            }, {
	                name: 'Test user 2',
	                email: 'test2@test.com'
	            }],
	            id: index,
	            eloRanking: 400
			});

			updateFormProgress('project', id, index, {
				last: 'Step Three',
				next: undefined,
				final: true,
			});
			return id;
    	},
        removeTestApplication: () => {
            let pq = ProjectQuestions.find({
                problem_description: 'test'
            }).fetch()

            if (pq && pq.length) {
            	pq.forEach(i => {
	            	ProjectQuestions.remove({
	            		_id: i._id
	            	})

	            	FormProgress.remove({
	            		form_type_id: i._id
	            	})
            	})
            }
        }
    })
}
