import './home.html'

import { ProjectQuestions } from '/imports/api/project-questions/project-questions';
import { FormProgress } from '/imports/api/form-progress/form-progress'

import moment from 'moment'

Template.App_home.onCreated(function() {
    this.autorun(() => {
        this.subscribe('projectQuestions'),
        this.subscribe('formProgress')
        this.subscribe('users')
    })
})

Template.App_home.helpers({
    projectquestions: () => {
    	let user = Meteor.users.findOne({
    		_id: Meteor.userId()
    	}) || {}

    	return ProjectQuestions.find({
    		$or: [{
	        	createdBy: Meteor.userId(),
	    	}, {
	    		'team_members.email': ((user.emails || [])[0] || {}).address 
	    	}]
	    }, {
	        sort: {
	            createdAt: -1
	        }
	    }).fetch().map(i => _.extend(i, {
	    	progress: FormProgress.findOne({
	    		form_type_id: i._id
	    	})
	    }))
    },
    inprogress: (status) => {
    	//Check to see if an application has an in-progress form in progress, if it does return a resume button.
        if (status === 'in-progress') {
            return true;
        }
    },
    formatProgressStatus: (status, progressID, authorId) => {
        let formatted = {}
        formatted.status = status
        formatted.id = progressID

        if (status === 'completed') {
            formatted.klass = 'success'
            formatted.text = 'View'
            formatted.path = 'view'
            formatted.canSee = true
        }
            
        if (status === 'in-progress') {
            formatted.klass = 'secondary'
            formatted.text = 'Resume'
            formatted.path = ''
            formatted.canSee = Meteor.userId() === authorId
        }

        return formatted
    },
    author: (userId) => {
        let user = Meteor.users.findOne({ _id: userId }) || {}
        return user.username ? user.username : ((user.emails || [])[0] || {}).address 
    },
    formatDate: (timestamp) => {
        return moment(timestamp).format('MMMM Do YYYY, h:mm a')
    }

})