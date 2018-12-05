import './home.html'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { ProjectQuestions } from '/imports/api/project-questions/project-questions';
import { FormProgress } from '/imports/api/form-progress/form-progress'
import { UserQuestions } from '/imports/api/userQuestions/userQuestions'

import moment from 'moment'
import { redirectToUserInfoIfNeeded } from '../../redirectionModalHelper';

Template.App_home.onCreated(function() {
  	this.autorun(() => {
    	this.subscribe('projectQuestions')
    	this.subscribe('formProgress')
    	this.subscribe('users')
    	this.subscribe('userInfo')

    	if (Meteor.user() && Meteor.user().moderator){
      		FlowRouter.go('/moderator/applications')
    	}
		redirectToUserInfoIfNeeded(this);
  	})
})

Template.App_home.helpers({
	userInfo: () => {
		let user = Meteor.users.findOne({
    		_id: Meteor.userId()
    	})

    	if (user) {
    		let uq = UserQuestions.findOne({
    			createdBy: Meteor.userId()
    		})

    		if (uq) {
	    		return _.extend(uq, {
	          		progress: FormProgress.findOne({
	            		form_type_id: uq._id
	          		})
	          	})
    		}
    	}
	},
	updatedAt: function() {
		return this.updatedAt || this.progress.updated_at
	},
    projectquestions: () => {
    	let user = Meteor.users.findOne({
    		_id: Meteor.userId()
    	})
      if(user){
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
      }
      return false
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