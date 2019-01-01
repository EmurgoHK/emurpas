import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema'
import { ValidatedMethod } from 'meteor/mdg:validated-method'

import { Contact } from './contact'

import { isModerator } from '/imports/api/user/methods'

import { sendNotification } from '/imports/api/notifications/methods'

export const notifyContact = (type, resId, text, userId) => {
    let contact = Contact.findOne({
        _id: resId
    })

    if (contact && (userId !== contact.createdBy)) {
        sendNotification(contact.createdBy, `A moderator has anwered your question (${resId}): ${text}`, 'System', `/contact/view/${contact._id}`)
    }
}

export const newContact = new ValidatedMethod({
    name: 'newContact',
    validate:
        new SimpleSchema({
            title: {
                type: String,
                optional: false,
                max: 100
            },
            body: {
                type: String,
                optional: false
            },
            email: {
                type: String,
                optional: false,
                regEx: SimpleSchema.RegEx.Email
            }
        }).validator({
            clean: true
        }),
    run({ title, body, email }) {
        let insertContactObj = {
            title: title,
            body: body,
            email: email,
            createdBy: Meteor.userId() || '',
            createdAt: new Date().getTime(),
            status: 'open'
        }
        return Contact.insert(insertContactObj)
    }
})

export const changeContactStatus = new ValidatedMethod({
    name: 'changeContactStatus',
    validate:
        new SimpleSchema({
            contactId: {
                type: String,
                optional: false
            },
            status: {
                type: String,
                optional: false
            }
        }).validator(),
    run({ contactId, status }) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('Error.', 'You have to be logged in.')
        }

        let contact = Contact.findOne({
            _id: contactId
        })

        if (!contact) {
            throw new Meteor.Error('Error.', 'Invalid contact id.')
        }

        if (contact.createdBy !== Meteor.userId() && !isModerator(Meteor.userId())) {
            throw new Meteor.Error('Error.', 'You can\'t change status of this contact.')
        }

        Contact.update({
            _id: contactId
        }, {
            $set: {
                status: status,
                updatedAt: new Date().getTime()
            }
        })
    }
})

export const removeContact = new ValidatedMethod({
    name: 'removeContact',
    validate:
        new SimpleSchema({
            contactId: {
                type: String,
                optional: false
            }
        }).validator(),
    run({ contactId }) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('Error.', 'You have to be logged in.')
        }

        let contact = Contact.findOne({
            _id: contactId
        })

        if (!contact) {
            throw new Meteor.Error('Error.', 'Invalid contact id.')
        }

        if (contact.createdBy !== Meteor.userId() && !isModerator(Meteor.userId())) {
            throw new Meteor.Error('Error.', 'You can\'t remove this contact.')
        }

        Contact.remove({
            _id: contactId
        })
    }
})
