import './modApplication.html'

import { FlowRouter } from 'meteor/kadira:flow-router'

import { ProjectQuestions } from '/imports/api/project-questions/project-questions'
import { FormProgress } from '/imports/api/form-progress/form-progress'
import { QuestionRating } from '/imports/api/question-rating/question-rating'

import { removeProjectQuestions } from '/imports/api/project-questions/methods'
import { rateQuestion } from '/imports/api/question-rating/methods'

import swal from 'sweetalert'
import { notify } from '/imports/modules/notifier'

const MAX_RATING = 10

Template.modApplication.onCreated(function() {
    this.autorun(() => {
        this.subscribe('modProjectQuestions', FlowRouter.getParam('id'))
        this.subscribe('modFormProgress', FlowRouter.getParam('id'))
        this.subscribe('questionRating.all')
    })
})

Template.modApplication.helpers({
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
                return {
                    question: {label: label, key: key},
                    answer: application[key] || '-'
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
    hasRatings: (ratings) => {
        if (ratings !== undefined) return true
    },
    ratings: function () {
        return QuestionRating.findOne({
            applicationId: FlowRouter.getParam('id'),
            questionCode: this.question.key
        })
    }

})

Template.modApplication.events({
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
            notify('Success', 'success')
        })
    }
})