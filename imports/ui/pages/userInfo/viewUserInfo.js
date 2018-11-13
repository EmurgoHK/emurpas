import './viewUserInfo.html'

import { UserQuestions } from '/imports/api/userQuestions/userQuestions'

import { notify } from '/imports/modules/notifier'
import moment from 'moment'

Template.viewUserInfo.onCreated(function() {
    window.UserQuestions = UserQuestions

    this.autorun(() => {
        this.subscribe('userInfo')
        this.subscribe('formProgress', FlowRouter.getParam('id'))
    })

    this.edit = new ReactiveDict()
})

Template.viewUserInfo.events({
    'click .edit': function(event, templateInstance) {
        event.preventDefault()

        templateInstance.edit.set(this.question.key, true)
    },
    'click .js-cancel': function(event, templateInstance) {
        event.preventDefault()

        templateInstance.edit.set(this.question.key, false)
    },
    'click .js-save': function(event, templateInstance) {
        event.preventDefault()

        $(`#${this.question.key}`).submit()

        templateInstance.edit.set(this.question.key, false)
    }
})

Template.viewUserInfo.helpers({
    editMode: function() {
        return Template.instance().edit.get(this.question.key)
    },
    uq: () => UserQuestions.findOne({
        _id: FlowRouter.getParam('id')
    }) || {},
    uId: () => FlowRouter.getParam('id'),
    info: () => {
        let schema = UserQuestions.schema

        let uq = UserQuestions.findOne({
            _id: FlowRouter.getParam('id')
        }) || {}
        
        let to_exclude = ['Created At', 'Author', 'Updated At']

        return schema.objectKeys().map(key => {
            const label = schema.label(key)

            if (!to_exclude.includes(label)) {
                let answer = uq[key]

                if (key === 'dob') {
                    answer = answer ? moment(answer).format('L') : '-'
                }

                return {
                    question: {
                        label: label, key: key
                    },
                    answer: answer || '-'
                }
            }
        }).filter((val) => val)
    }
})