import './viewContact.html'
import '../comments/commentBody'

import { Comments } from '/imports/api/comments/comments'

import { newComment } from '/imports/api/comments/methods' 

import { Contact } from '/imports/api/contact/contact'
import { changeContactStatus } from '/imports/api/contact/methods'

import { isModerator } from '/imports/api/user/methods'

import { notify } from '/imports/modules/notifier'

import { formatStatus } from './contact'

Template.viewContact.onCreated(function() {
    this.reply = new ReactiveVar(true)

    this.autorun(() => {
        this.subscribe('contact')

        this.subscribe('users')
        this.subscribe('comments.item', FlowRouter.getParam('id'))

        this.reply.set(!Comments.find({
            resourceId: FlowRouter.getParam('id')
        }).count())
    })

    this.message = new ReactiveVar('')
})

Template.viewContact.events({
    'click .new-comment': (event, templateInstance) => {
        event.preventDefault()

        newComment.call({
            parentId: FlowRouter.getParam('id'),
            text: $(`#comments`).val(),
            resourceId: FlowRouter.getParam('id'),
            type: isModerator(Meteor.userId()) ? 'answer' : 'comment'
        }, (err, data) => {
            $(`#comments`).val('')
            
            if (!err) {
                notify('Successfully commented.', 'success')
                templateInstance.reply.set(false)

                templateInstance.message.set('')
            } else {
                templateInstance.message.set(err.reason || err.message)
            }
        })
    },
    'click .comment-new': (event, templateInstance) => {
        event.preventDefault()

        templateInstance.reply.set(true)
    },
    'click .cancel-new': (event, templateInstance) => {
        event.preventDefault()

        templateInstance.reply.set(false)
    },
    'click .change-status': function(event, templateInstance) {
        event.preventDefault()

        changeContactStatus.call({
            contactId: this._id,
            status: $(event.currentTarget).data('status')
        }, (err, data) => {})
    }
})

Template.viewContact.helpers({
    isOpen: function() {
        return this.status === 'open'
    },
    isAuthor: function() {
        return this.createdBy === Meteor.userId()
    },
    formatStatus: status => formatStatus(status),
    contact: () => {
        return Contact.findOne({
            _id: FlowRouter.getParam('id')
        })
    },
    comments: () => {
        return Comments.find({
            parentId: FlowRouter.getParam('id')
        }, {
            sort: {
                createdAt: -1
            }
        })
    },
    commentInvalidMessage: () => {
        return Template.instance().message.get()
    },
    showReply: () => {
        return Template.instance().reply.get()
    },
    commentCount: () => {
        return Comments.find({
            resourceId: FlowRouter.getParam('id')
        }).count()
    },
    type: () => isModerator(Meteor.userId()) ? 'answer' : 'comment'
})