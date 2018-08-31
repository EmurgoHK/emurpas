import { chai, assert } from 'chai'
import { Meteor } from 'meteor/meteor'

import { FormProgress } from './form-progress'
import { updateFormProgress } from './methods'

Meteor.userId = () => 'test-user' // override the meteor userId, so we can test methods that require a user
Meteor.users.findOne = () => ({ moderator: true, profile: { name: 'Test User'} }) // stub user data as well
Meteor.user = () => ({ moderator: true, profile: { name: 'Test User'} })

describe('form progress methods', () => {
    it('can track new user form progress', () => {
        var progress = FormProgress.find({}).fetch()

        updateFormProgress('test', 'new', {last: '1', next: '2', final: false})
        progress = FormProgress.findOne({form_type: 'test'})
        assert.ok(progress)
        assert.propertyVal(progress, 'status', 'in-progress');
        assert.propertyVal(progress, 'form_type', 'test');
        assert.propertyVal(progress, 'user_id', Meteor.userId());
    })

    it('can update tracked form progress', () => {
        updateFormProgress('test', 'updated', {last: '1', next: '2', final: false})
        var progress = FormProgress.findOne({ 'form_type_id' : 'updated' })
        assert.ok(progress)
        assert.propertyVal(progress, 'status', 'in-progress');
        assert.propertyVal(progress, 'user_id', Meteor.userId());

        updateFormProgress(progress.form_type, progress.form_type_id, {last: '2', next: '3', final: true})
        progress = FormProgress.findOne({ 'form_type_id' : progress.form_type_id })
        assert.propertyVal(progress, 'last_step', '2');
        assert.propertyVal(progress, 'next_step', '3');
        assert.propertyVal(progress, 'status', 'completed');
    })

    after(function() {
        FormProgress.remove({})
    })
})
