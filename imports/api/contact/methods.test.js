import { chai, assert } from 'chai'
import { Meteor } from 'meteor/meteor'

import { Contact } from './contact'
import { callWithPromise } from '/imports/api/utilities'

import './methods'

Meteor.userId = () => 'test-user' // override the meteor userId, so we can test methods that require a user
Meteor.users.findOne = () => ({ _id: 'test-user', profile: { name: 'Test User'}, moderator: true }) // stub user data as well
Meteor.user = () => ({ _id: 'test-user', profile: { name: 'Test User'}, moderator: true })

describe('contact methods', () => {
    it('user can create a new question', () => {
        return callWithPromise('newContact', {
            title: 'Test title',
            body: 'Test body',
            email: 'ab@ab.com'
        }).then(data => {
            let contact = Contact.findOne({})

            assert.ok(contact)

            assert.ok(contact.title === 'Test title')
            assert.ok(contact.body === 'Test body')
            assert.ok(contact.email === 'ab@ab.com')
        })
    })

    it('user cannot create a new question if data is missing', () => {
        return callWithPromise('newContact', {
            title: 'Test'
        }).then(data => {
            assert.fail('Data added even though data was missing.')
        }).catch(err => {
            assert.ok(err)
        })
    })

    it('user can change question\'s status', () => {
        let contact = Contact.findOne({})

        assert.ok(contact)

        return callWithPromise('changeContactStatus', {
            contactId: contact._id,
            status: 'closed'
        }).then(data => {
            let c2 = Contact.findOne({
                _id: contact._id
            })

            assert.ok(c2)
            assert.ok(c2.status === 'closed')
        })
    })

    it ('user can remove a question', () => {
        let contact = Contact.findOne({})

        assert.ok(contact)

        return callWithPromise('removeContact', {
            contactId: contact._id
        }).then(data => {
            assert.ok(!Contact.findOne({}))
        })
    })

    after(function() {
        Contact.remove({})
    })
})
