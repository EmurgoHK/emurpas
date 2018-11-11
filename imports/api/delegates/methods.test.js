import { chai, assert } from 'chai'
import { Meteor } from 'meteor/meteor'

import { Delegates } from './delegates'
import { callWithPromise } from '/imports/api/utilities'

import './methods'

Meteor.userId = () => 'test-user' // override the meteor userId, so we can test methods that require a user
Meteor.users.findOne = () => ({ _id: 'test-user', profile: { name: 'Test User'}, moderator: true }) // stub user data as well
Meteor.user = () => ({ _id: 'test-user', profile: { name: 'Test User'}, moderator: true })

describe('delegate methods', () => {
    it('user can delegate a question', () => {
        return callWithPromise('delegateQuestion', {
            questionId: 'problem_description',
            delegateTo: 'testing',
            scope: ['all']
        }).then(data => {
            let delegate = Delegates.findOne({})

            assert.ok(delegate)

            assert.ok(delegate.questionId === 'problem_description')
            assert.ok(delegate.delegateTo === 'testing')
            assert.ok(delegate.scope.length === 1)
            assert.ok(delegate.scope[0] === 'all')
        })
    })

    it('user cannot delegate a question if data is missing', () => {
        return callWithPromise('delegateQuestion', {
            questionId: 'problem_description',
            delegateTo: 'testing'
        }).then(data => {
            assert.fail('Data added even though data was missing.')
        }).catch(err => {
            assert.ok(err)
        })
    })

    it('user can revoke question delegation', () => {
        return callWithPromise('revokeDelegation', {
            questionId: 'problem_description',
            except: ['all']
        }).then(data => {
            assert.ok(!Delegates.findOne({}))
        })
    })

    after(function() {
        Delegates.remove({})
    })
})
