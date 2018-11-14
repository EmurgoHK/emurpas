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
        this.subscribe('users')
    })

    this.search = new ReactiveVar('')
})

Template.modApplications.helpers({
    isInProgress: function(status) {
        return status == 'in-progress'
    },
    formProgress: function () {
        let search = Template.instance().search.get()
        let pq = []

        if (!search) {
            pq = ProjectQuestions.find({}, {
                sort: {
                    createdAt: -1
                }
            }).fetch().map(i => i._id)
        } else {
            let posAuthors = Meteor.users.find({
                $or: [
                {'username': new RegExp(search, 'ig')},
                {'emails.address': new RegExp(search, 'ig')}
                ]
            }).fetch().map(i => i._id)

            pq = ProjectQuestions.find({
                $or: [
                {status: new RegExp(search, 'ig')},
                {'team_members.name': new RegExp(search, 'ig')},
                {'team_members.email': new RegExp(search, 'ig')},
                {problem_description: new RegExp(search, 'ig')},
                {createdBy: {
                    $in: posAuthors
                }}
                ]
            }, {
                sort: {
                    createdAt: -1
                }
            }).fetch().map(i => i._id)
        }

        var progress = FormProgress.find({
            form_type: 'project',
            form_type_id: {
                $in: pq
            }
        }, {
            sort: {
                createdAt: -1
            }
        })

        return progress
    },
    author: (userId) => {
        let user = Meteor.users.findOne({ _id: userId }) || {}
        return ((user.emails || [])[0] || {}).address
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
    'keyup .search': (event, templateInstance) => templateInstance.search.set($(event.currentTarget).val()),
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