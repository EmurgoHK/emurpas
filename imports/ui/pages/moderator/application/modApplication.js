import './modApplication.html'

import { FlowRouter } from 'meteor/kadira:flow-router'

import { ProjectQuestions } from '/imports/api/project-questions/project-questions'
import { FormProgress } from '/imports/api/form-progress/form-progress'

import { removeProjectQuestions } from '/imports/api/project-questions/methods'

import swal from 'sweetalert'
import { notify } from '/imports/modules/notifier'

Template.modApplication.onCreated(function() {
    this.autorun(() => {
        this.subscribe('modProjectQuestions', FlowRouter.getParam('id'))
        this.subscribe('modFormProgress', FlowRouter.getParam('id'))
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
        let schema = ProjectQuestions.schema.schema()
        let application = ProjectQuestions.findOne({
            _id: FlowRouter.getParam('id')
        }) || {}

        return Object.keys(schema).map(i => {
            return {
                question: schema[i].label,
                answer: application[i] || '-'
            }
        })
    }
})

Template.modApplication.events({
    'click .js-remove': function(event, templateInstance) {
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
    }
})