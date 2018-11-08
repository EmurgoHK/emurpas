import { Mongo } from 'meteor/mongo'
import { isModerator } from '/imports/api/user/methods'
import { ProjectQuestions } from '/imports/api/project-questions/project-questions'

export const FormProgress = new Mongo.Collection('formProgress')

if (Meteor.isServer) {
    // This code only runs on the server
    Meteor.publish('formProgress', function(formTypeID) {
        if (formTypeID) {
            return FormProgress.find({ 'form_type_id': formTypeID });
        } else {
        	let user = Meteor.users.findOne({
	            _id: Meteor.userId()
	        }) || {}

	    	let questions = ProjectQuestions.find({
	    		$or: [{
	                createdBy: Meteor.userId(),
	            }, {
	                'team_members.email': ((user.emails || [])[0] || {}).address 
	            }]
	    	}).fetch()
	    	
            return FormProgress.find({
            	form_type_id: {
            		$in: questions.map(i => i._id)
            	}
            })
        }
    })
            

    Meteor.publish('modFormProgress', (projectID) => {
        if (Meteor.userId() && isModerator(Meteor.userId())) {
            if (projectID) {
                return FormProgress.find({
                    'form_type_id': projectID
                })
            } else {
                return FormProgress.find({})
            }
        }
    })
}