import { ValidatedMethod } from 'meteor/mdg:validated-method'
import SimpleSchema from 'simpl-schema'

import { ProjectQuestions } from './project-questions'
import { updateFormProgress } from '../form-progress/methods'
import { ApplicationCount } from './application-count'
import { FormProgress } from '../form-progress/form-progress'

import { isModerator } from '/imports/api/user/methods'

import { sendNotification } from '/imports/api/notifications/methods'

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
  validate (_params) { },
  run({ projectID, data, steps }) {
    if (Meteor.isServer) {
      if (Meteor.userId()) {
        if (projectID === 'new') {
          data.id = uniqueIndex('application')
          projectID = ProjectQuestions.insert(data, {validate: false})   
        } else {
          ProjectQuestions.update({ '_id' : projectID }, { $set : data })
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
