import './home.html'

import { ProjectQuestions } from '/imports/api/project-questions/project-questions';
import { FormProgress } from '/imports/api/form-progress/form-progress'

import moment from 'moment'

Template.App_home.onCreated(function() {
    this.autorun(() => {
        this.subscribe('projectQuestions'),
        this.subscribe('formProgress')
    })
})

Template.App_home.helpers({
    projectquestions: () => ProjectQuestions.find({
        createdBy: Meteor.userId(),
    }, {
        sort: {
            createdAt: -1
        }
    }),
    formProgress: () => FormProgress.find({
        user_id: Meteor.userId(),
        form_type: 'project'
    }, {
        sort: {
            createdAt: -1
        }
    }),
    inprogress: (status) => {
    	//Check to see if an application has an in-progress form in progress, if it does return a resume button.
        if (status === 'in-progress') {
            return true;
        }
    },
    formatProgressStatus: (status, progressID) => {
        let formatted = {}
        formatted.status = status
        formatted.id = progressID

        if (status === 'completed') {
            formatted.klass = 'success'
            formatted.text = 'View'
            formatted.path = 'view'

        }
            
        if (status === 'in-progress') {
            formatted.klass = 'secondary'
            formatted.text = 'Resume'
            formatted.path = ''
        }

        return formatted
    },
    author: (userId) => {
        let user = Meteor.users.findOne({ _id: userId })
        return user.emails[0].address
    },
    formatDate: (timestamp) => {
        return moment(timestamp).format('MMMM Do YYYY, h:mm a')
    }

})