import './modApplications.html'

import { ProjectQuestions } from '/imports/api/project-questions/project-questions'
import { FormProgress } from '/imports/api/form-progress/form-progress'

import { removeProjectQuestions } from '/imports/api/project-questions/methods'

import swal from 'sweetalert'
import moment from 'moment'
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
    isInProgress: function(status) {
        return status == 'in-progress'
    },
    formProgress: function () {
        var progress = FormProgress.find({
            form_type: 'project'
        }, {
            sort: {
                createdAt: -1
            }
        })

        return progress
    },
    author: (userId) => {
        let user = Meteor.users.findOne({ _id: userId })
        return user.emails[0].address
    },
    formatDate: (timestamp) => {
        return moment(timestamp).format('MMMM Do YYYY, h:mm a')
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
                    projectId: this.form_type_id
                }, (err, data) => {
                    if (err) {
                        notify(err.reason || err.message, 'error')
                    }
                })
            }
        })
    }
})