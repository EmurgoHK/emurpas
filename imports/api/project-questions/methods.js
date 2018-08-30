import { ValidatedMethod } from 'meteor/mdg:validated-method'
import SimpleSchema from 'simpl-schema'

import { ProjectQuestions } from './project-questions'
import { updateFormProgress } from '../form-progress/methods'

import { FormProgress } from '../form-progress/form-progress'

import { isModerator } from '/imports/api/user/methods'

SimpleSchema.extendOptions(['autoform'])

export const saveProjectQuestions = new ValidatedMethod({
    name: 'saveProjectQuestions',
    validate (_params) { },
    run({ projectID, data, steps }) {
        if (Meteor.isServer) {
            if (Meteor.userId()) {
                if (projectID === 'new') {
                    projectID = ProjectQuestions.insert(data, {validate: false})   
                } else {
                    ProjectQuestions.update({ '_id' : projectID }, { $set : data })
                }

                updateFormProgress('project', projectID, steps)
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
        removeTestApplication: () => {
            let pq = ProjectQuestions.findOne({
                problem_description: 'test'
            })

            if (pq) {
            	ProjectQuestions.remove({
            		_id: pq._id
            	})

            	FormProgress.remove({
            		form_type_id: pq._id
            	})
            }
        }
    })
}
