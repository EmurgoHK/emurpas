import './viewApplication.html'
import '../comments/commentBody'

import { Comments } from '/imports/api/comments/comments'

import { newComment } from '/imports/api/comments/methods' 

import { ProjectQuestions } from '/imports/api/project-questions/project-questions';
import { QuestionRating } from '/imports/api/question-rating/question-rating'
import { UserQuestions } from '/imports/api/userQuestions/userQuestions'
import { FormProgress } from '/imports/api/form-progress/form-progress'

import { notify } from '/imports/modules/notifier'

Template.viewApplication.onCreated(function() {
    this.autorun(() => {
        this.subscribe('projectQuestions', FlowRouter.getParam('projectID'))
        this.subscribe('formProgress', FlowRouter.getParam('projectID'))
        this.subscribe('questionRating.all')
    	this.subscribe('formProgress')

        this.subscribe('users')
        this.subscribe('userQuestions')
        this.subscribe('comments.item', FlowRouter.getParam('projectID'))
    })

    this.message = new ReactiveDict()
    this.reply = new ReactiveDict()
    this.show = new ReactiveDict()
})

Template.viewApplication.events({
    'click .new-comment': function(event, templateInstance) {
        event.preventDefault()

        newComment.call({
            parentId: FlowRouter.getParam('projectID'),
            text: $(`#comments-${this.question.key}`).val(),
            resourceId: FlowRouter.getParam('projectID'),
            fieldId: this.question.key
        }, (err, data) => {
            $(`#comments-${this.question.key}`).val('')
            
            if (!err) {
                notify('Successfully commented.', 'success')
                templateInstance.reply.set(this.question.key, false);

                templateInstance.message.set(this.question.key, '')
                templateInstance.show.set(this.question.key, true)
            } else {
                templateInstance.message.set(this.question.key, err.reason || err.message)
            }
        })
    },
    'click .comment-new': function(event, templateInstance) {
        event.preventDefault()

        templateInstance.reply.set(this.question.key, true)
    },
    'click .cancel-new': function(event, templateInstance) {
        event.preventDefault()

        templateInstance.reply.set(this.question.key, false)
    },
    'click .comment-show': function(event, templateInstance) {
        event.preventDefault()

        templateInstance.show.set(this.question.key, !templateInstance.show.get(this.question.key))
    }
})

Template.viewApplication.helpers({
    projectID: () => FlowRouter.getParam('projectID'),
    projectNumber: () => (ProjectQuestions.findOne({
        _id: FlowRouter.getParam('projectID')
    }) || {}).id,
    project: () => {
        let schema = ProjectQuestions.schema

        let application = ProjectQuestions.findOne({
            _id: FlowRouter.getParam('projectID')
        }) || {}
        
        let to_exclude = ['Created At', 'Author', 'Team members', 'ELO', 'ID']

        return schema.objectKeys().map(key => {
            const label = schema.label(key)

            if (!to_exclude.includes(label)) {
                return {
                    question: {
                        label: label, key: key
                    },
                    answer: application[key] || '-'
                }
            }
        }).filter((val) => val)
    },
    hasRatings: (ratings) => {
        if (ratings !== undefined) return true
    },
    ratings: function () {
        return QuestionRating.findOne({
            applicationId: FlowRouter.getParam('projectID'),
            questionCode: this.question.key
        })
    },
    comments: function() {
        return Comments.find({
            parentId: FlowRouter.getParam('projectID'),
            fieldId: this.question.key
        }, {
            sort: {
                createdAt: -1
            }
        })
    },
    commentInvalidMessage: function() {
        return Template.instance().message.get(this.question.key)
    },
    showReply: function() {
        return Template.instance().reply.get(this.question.key)
    },
    showComments: function() {
        return Template.instance().show.get(this.question.key)
    },
    showLine: function() {
        return Template.instance().reply.get(this.question.key) || Template.instance().show.get(this.question.key)
    },
    commentCount: function() {
        return Comments.find({
            fieldId: this.question.key,
            resourceId: FlowRouter.getParam('projectID')
        }).count()
    },
    type: () => 'comment',
    applicationStatus: () => {
        let application = ProjectQuestions.findOne({
            _id: FlowRouter.getParam('projectID')
        }) || {}

        if(application && application.team_members) {
            
            let teamComplete = true
            let hasModQuestions = false
            

            // check if the user completed the form
            let formProgress = FormProgress.findOne({
              form_type_id: application._id
            })

            let isFormComplete = formProgress && formProgress.status == 'completed'

            // check if all the users in the team have filled the user questions
            application.team_members.forEach(function(member) {
                
                // get the team member by email
                let user = Meteor.users.findOne({ emails: {
                    $elemMatch:  {
                        address : member.email
                    }
                }})

                let userInfo =[]
                // check if the user has field the user questions
                if(user) {
                    userInfo = Array.from(UserQuestions.find({
                        createdBy: user._id
                    }))
                }
                
                // if one of the member has not completed the user questions then the form is incomplete
                if(userInfo.length < 1) teamComplete = false
            })

            // check if there is a question from moderators
            let questions = Array.from(Comments.find({
                parentId: FlowRouter.getParam('projectID'),
                type: "question"
            }))

            // if there are moderator questions the we need to change the status of modQuestions flag
            if (questions.length > 0) hasModQuestions = true

            // set status for UI on page
            if (!isFormComplete) {
                return { message: 'Incomplete application form', class: 'secondary'}
            }
            else if (!teamComplete) {
                return { message: 'Waiting for team members to complete personal information', class: 'secondary'}
            } else if(hasModQuestions) {
                return { message: 'The reviewers have questions for you, please view your application to respond', class: 'warning'}
            } else if (application.status && application.status == 'rejected') {
                return { message: 'This application was rejected', class: 'danger'}
            } else {
                return { message: 'Your application is being reviewed', class: 'primary'}
            }
        }

        
    }
})