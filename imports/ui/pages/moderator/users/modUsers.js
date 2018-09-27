import './modUsers.html'

import { updateUserStatus } from '/imports/api/user/methods'

import swal from 'sweetalert'
import { notify } from '/imports/modules/notifier'

Template.modUsers.onCreated(function() {
    this.autorun(() => {
        this.subscribe('modUsers')
    })
})

Template.modUsers.helpers({
    users: () => Meteor.users.find({
        _id : { $ne : Meteor.userId() }
    }, {
        sort: {
            createdAt: -1
        }
    }),
    email: function() {
        return ((this.emails || [])[0] || {}).address
    },
    username: function() {
        return this.username || ((this.emails || [])[0] || {}).address
    }
})

Template.modUsers.events({
    'click .js-promote, click .js-demote': function(event, templateInstance) {
        let action = $(event.currentTarget).attr('class').includes('promote')

        swal({
            text: `Are you sure you want to ${action ? 'promote' : 'demote'} this user?`,
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
            }
        }).then(confirmed => {
            if (confirmed) {
                updateUserStatus.call({
                    userId: this._id,
                    moderator: action
                }, (err, data) => {
                    if (err) {
                        notify(err.reason || err.message, 'error')
                    }
                })
            }
        })
    }
})