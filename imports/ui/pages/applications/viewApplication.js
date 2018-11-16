import './viewApplication.html'
import '../comments/commentBody'

import { Comments } from '/imports/api/comments/comments'

import { newComment } from '/imports/api/comments/methods' 

import { ProjectQuestions } from '/imports/api/project-questions/project-questions';
import { QuestionRating } from '/imports/api/question-rating/question-rating'

import { notify } from '/imports/modules/notifier'

Template.viewApplication.onCreated(function() {
    this.autorun(() => {
        this.subscribe('projectQuestions', FlowRouter.getParam('projectID'))
        this.subscribe('formProgress', FlowRouter.getParam('projectID'))
        this.subscribe('questionRating.all')

        this.subscribe('users')
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
    project: () => {
        let schema = ProjectQuestions.schema

        let application = ProjectQuestions.findOne({
            _id: FlowRouter.getParam('projectID')
        }) || {}
        
        let to_exclude = ['Created At', 'Author', 'Team members', 'ELO']

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
    type: () => 'comment'
})