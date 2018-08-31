import './modApplications.html'

import { ProjectQuestions } from '/imports/api/project-questions/project-questions'
import { FormProgress } from '/imports/api/form-progress/form-progress'

import { removeProjectQuestions } from '/imports/api/project-questions/methods'

import swal from 'sweetalert'
import { notify } from '/imports/modules/notifier'

Template.modApplications.onCreated(function() {
    this.autorun(() => {
        this.subscribe('modProjectQuestions')
        this.subscribe('modFormProgress')
    })
})

Template.modApplications.helpers({
    applications: () => ProjectQuestions.find({}, {
        sort: {
            createdAt: -1
        }
    }),
    isInProgress: function() {
        let inprogress = FormProgress.findOne({
            form_type_id: this._id
        })
        
        return inprogress && inprogress.status == 'in-progress'
    }
})

Template.modApplications.events({
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
                    projectId: this._id
                }, (err, data) => {
                    if (err) {
                        notify(err.reason || err.message, 'error')
                    }
                })
            }
        })
    }
})