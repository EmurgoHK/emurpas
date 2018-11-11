import './modApplication.html'
import '../../comments/commentBody'

import { Comments } from '/imports/api/comments/comments'

import { newComment } from '/imports/api/comments/methods' 

import { FlowRouter } from 'meteor/kadira:flow-router'

import { ProjectQuestions } from '/imports/api/project-questions/project-questions'
import { FormProgress } from '/imports/api/form-progress/form-progress'
import { QuestionRating } from '/imports/api/question-rating/question-rating'
import { Delegates } from '/imports/api/delegates/delegates'

import { removeProjectQuestions } from '/imports/api/project-questions/methods'
import { rateQuestion } from '/imports/api/question-rating/methods'
import { delegateQuestion, revokeDelegation } from '/imports/api/delegates/methods'

import swal from 'sweetalert'
import { notify } from '/imports/modules/notifier'

const MAX_RATING = 10

Template.modApplication.onCreated(function() {
    window.testingComments = Comments 
    
    this.autorun(() => {
        this.subscribe('modProjectQuestions', FlowRouter.getParam('id'))
        this.subscribe('modFormProgress', FlowRouter.getParam('id'))
        this.subscribe('questionRating.all')

        this.subscribe('users')
        this.subscribe('comments.item', FlowRouter.getParam('id'))

        this.subscribe('delegates')
    })

    this.message = new ReactiveDict()
    this.reply = new ReactiveDict()
    this.show = new ReactiveDict()
    this.delegates = new ReactiveDict()
})

Template.modApplication.helpers({
    projectID: () => FlowRouter.getParam('id'),
    application: () => ProjectQuestions.findOne({
        _id: FlowRouter.getParam('id')
    }),
    isInProgress: function() {
        let inprogress = FormProgress.findOne({
            form_type_id: this._id
        })
        
        return inprogress && inprogress.status == 'in-progress'
    },
    formProgress: () => FormProgress.find({
        form_type: 'project'
    }, {
        sort: {
            createdAt: -1
        }
    }),
    questions: () => {
        let schema = ProjectQuestions.schema
        let application = ProjectQuestions.findOne({
            _id: FlowRouter.getParam('id')
        }) || {}
        let to_exclude = ['Created At', 'Author', 'Team members']

        return schema.objectKeys().map(key => {
            const label = schema.label(key)

            if (!to_exclude.includes(label)) {
                let delegates = Delegates.findOne({
                    questionId: key,
                    createdBy: Meteor.userId()
                }) || {}

                let delegatedFrom = Delegates.find({
                    questionId: key,
                    delegateTo: Meteor.userId()
                }).fetch()

                delegatedFrom = delegatedFrom.map(i => Meteor.users.findOne({
                    _id: i.createdBy
                }))

                delegates.user = Meteor.users.findOne({
                    _id: delegates.delegateTo
                })

                return {
                    question: {label: label, key: key},
                    answer: application[key] || '-',
                    delegates: delegates,
                    delegatedFrom: delegatedFrom
                }
            }
        }).filter((val) => val)
    },
    isAnswered: (answer) => {
        if (answer === '-') 
            return false

        return true
    },
    ratingValues: () => {
        return Array.from({length: MAX_RATING}, (_, i) => i + 1)
    },
    hasNotRated: (questionRating) => {
        if (questionRating && questionRating.ratings.some(r => r.userId === Meteor.userId())) {
            return false
        }

        return true
    },
    previousRating: (questionRating, rating) => {
        if (questionRating && questionRating.ratings.some(r => r.userId === Meteor.userId() && r.rating === rating)) {
            return 'checked'
        }
    },
    hasRatings: (ratings) => {
        if (ratings !== undefined) return true
    },
    ratings: function () {
        return QuestionRating.findOne({
            applicationId: FlowRouter.getParam('id'),
            questionCode: this.question.key
        })
    },
    comments: function() {
        return Comments.find({
            parentId: FlowRouter.getParam('id'),
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
            resourceId: FlowRouter.getParam('id')
        }).count()
    },
    type: () => 'question',
    isDelegated: function() {
        let delegates = Delegates.findOne({
            createdBy: Meteor.userId(),
            questionId: this.question.key
        })

        return delegates && (~delegates.scope.indexOf('all') || ~delegates.scope.indexOf(FlowRouter.getParam('id'))) && (!~(delegates.except || []).indexOf(FlowRouter.getParam('id')))
    },
    delegateIntent: function() {
        return Template.instance().delegates.get(this.question.key)
    },
    moderators: () => Meteor.users.find({
        _id: {
            $ne: Meteor.userId()
        },
        moderator: true
    }),
    username: function(context) {
        context = context || this

        return context.profile && context.profile.username || (context.emails && context.emails[0] && context.emails[0].address)
    }
})

Template.modApplication.events({
    'click .js-revoke': function(event, templateInstance) {
        event.preventDefault()

        revokeDelegation.call({
            questionId: this.question.key,
            except: [$(event.currentTarget).data('scope')]
        }, (err, data) => {
            if (!err) {
                notify('Successfully revoked.')
            } else {
                notify('Error while revoking delegation.', 'error')
            }
        })
    },
    'click .new-comment': function(event, templateInstance) {
        event.preventDefault()

        newComment.call({
            parentId: FlowRouter.getParam('id'),
            text: $(`#comments-${this.question.key}`).val(),
            resourceId: FlowRouter.getParam('id'),
            fieldId: this.question.key,
            type: 'question'
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
    'click .new-comment-moderator': function(event, templateInstance) {
        event.preventDefault()

        newComment.call({
            parentId: FlowRouter.getParam('id'),
            text: $(`#comments-${this.question.key}`).val(),
            resourceId: FlowRouter.getParam('id'),
            fieldId: this.question.key,
            isModeratorOnly: true,
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
    },
    'click .js-remove': function(event, _templateInstance) {
        swal({
            text: `Are you sure you want to remove this application?`,
            icon: 'warning',
            buttons: {
                cancel: {
                    text: 'No',
                    value: false,
                    visible: true,
                    closeModal: true
                },
                confirm: {
                    text: 'Yes',
                    value: true,
                    visible: true,
                    closeModal: true
                }
            },
            dangerMode: true
        }).then(confirmed => {
            if (confirmed) {
                removeProjectQuestions.call({
                    projectId: FlowRouter.getParam('id')
                }, (err, data) => {
                    if (err) {
                        notify(err.reason || err.message, 'error')
                    } else {
                        FlowRouter.go('/moderator/applications')
                    }
                })
            }
        })
    },
    'click .js-rate-question': function (event, _tpl) {
        event.preventDefault()
        const questionCode = this.question.key
        const applicationId = FlowRouter.getParam('id')
        const rating = $('input[name="' + questionCode + '_rating"]:checked').val()
        
        rateQuestion.call({ 
            applicationId: applicationId, questionCode: questionCode, rating: rating
        }, (err, data) => {
            if (err) {
                notify(err.message, 'error')
                return
            }
            
            if (event.currentTarget.id.includes('edit-')) {
                $(`#${event.target.id.substring(0, event.target.id.lastIndexOf('-'))}-rating`).addClass('d-none')

            }
            notify('Success', 'success')
        })
    },
    'click .js-rate-cancel': function(event, _tpl) {
        event.preventDefault()
        $(`#${event.target.id.substring(0, event.target.id.lastIndexOf('-'))}-rating`).addClass('d-none')
    },
    'click .js-edit-rating': function(event, _tpl) {
        // show edit mode
        $(`#${event.target.id}-rating`).removeClass('d-none')
    },
    'click .js-delegate': function(event, templateInstance) {
        event.preventDefault()

        templateInstance.delegates.set(this.question.key, !templateInstance.delegates.get(this.question.key))

        if (templateInstance.delegates.get(this.question.key)) {
            Meteor.setTimeout(() => $(`.js-user-choice-${this.question.key}`).select2(), 500)
        } else {
            $('.select2').remove()
        }
    },
    'click .js-delegate-question': (event, templateInstance) => {
        event.preventDefault()

        delegateQuestion.call({
            questionId: $(event.currentTarget).data('question'),
            scope: [$(event.currentTarget).data('scope')],
            delegateTo: $(`.js-user-choice-${$(event.currentTarget).data('question')}`).val()
        }, (err, data) => {
            if (!err) {
                notify('Successfully delegated.')

                templateInstance.delegates.set($(event.currentTarget).data('question'), false)
            } else {
                notify('Error while delegating question.', 'error')
            }
        })
    }
})