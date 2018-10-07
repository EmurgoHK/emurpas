import './viewApplication.html'

import { ProjectQuestions } from '/imports/api/project-questions/project-questions';
import { QuestionRating } from '/imports/api/question-rating/question-rating'

Template.viewApplication.onCreated(function() {
    this.autorun(() => {
        this.subscribe('projectQuestions', FlowRouter.getParam("projectID")),
        this.subscribe('formProgress', FlowRouter.getParam("projectID")),
        this.subscribe('questionRating.all')
    })
})

Template.viewApplication.helpers({
    projectID () {
        return FlowRouter.getParam("projectID")
    },
    project () {
        let schema = ProjectQuestions.schema
        let application = ProjectQuestions.findOne({
            _id: FlowRouter.getParam('projectID')
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
    hasRatings: (ratings) => {
        if (ratings !== undefined) return true
    },
    ratings: function () {
        return QuestionRating.findOne({
            applicationId: FlowRouter.getParam('projectID'),
            questionCode: this.question.key
        })
    }
})