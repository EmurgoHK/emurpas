import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema'
import { ValidatedMethod } from 'meteor/mdg:validated-method'

import { Delegates } from './delegates'
import { ProjectQuestions } from '/imports/api/project-questions/project-questions'

import { isModerator } from '/imports/api/user/methods'

export const delegateQuestion = new ValidatedMethod({
    name: 'delegateQuestion',
    validate:
        new SimpleSchema({
            questionId: {
                type: String,
                optional: false
            },
            delegateTo: {
                type: String,
                optional: false
            },
            scope: {
                type: Array,
                optional: false
            },
            'scope.$': {
                type: String
            }
        }).validator({
            clean: true
        }),
    run({ questionId, delegateTo, scope }) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('Error.', 'You have to be logged in.')
        }

        if (!isModerator(Meteor.userId())) {
            throw new Meteor.Error('Error.', 'Only moderators can delegate question voting.');
        }

        if (!isModerator(delegateTo)) {
            throw new Meteor.Error('Error.', 'The user you\'re delagating to has to be a moderator as well.')
        }

        if (!~ProjectQuestions.schema.objectKeys().indexOf(questionId)) {
            throw new Meteor.Error('Error.', 'Invalid question id.')
        }

        let delegate = Delegates.findOne({
            questionId: questionId,
            createdBy: Meteor.userId()
        })

        if (delegate) {
            return Delegates.update({
                questionId: questionId,
                createdBy: Meteor.userId()
            }, {
                $set: {
                    delegateTo: delegateTo
                },
                $push: {
                    scope: scope[0]
                },
                $pull: {
                    except: scope[0]
                }
            })
        }

        return Delegates.insert({
            questionId: questionId,
            delegateTo: delegateTo,
            scope: scope,
            createdBy: Meteor.userId(),
            createdAt: new Date().getTime()
        })
    }
})

export const revokeDelegation = new ValidatedMethod({
    name: 'revokeDelegation',
    validate:
        new SimpleSchema({
            questionId: {
                type: String,
                optional: false
            },
            except: {
                type: Array,
                optional: false
            },
            'except.$': {
                type: String
            }
        }).validator(),
    run({ questionId, except }) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('Error.', 'You have to be logged in.')
        }

        if (!isModerator(Meteor.userId())) {
            throw new Meteor.Error('Error.', 'Only moderators can revoke question delegations.');
        }

        if (!~ProjectQuestions.schema.objectKeys().indexOf(questionId)) {
            throw new Meteor.Error('Error.', 'Invalid question id.')
        }

        if (except.length && except[0] === 'all') { // if the moderator chooses to revoke all question delegations
            Delegates.remove({
                questionId: questionId,
                createdBy: Meteor.userId()
            })
        } else {
            Delegates.update({
                questionId: questionId,
                createdBy: Meteor.userId()
            }, {
                $set: {
                    except: except
                }
            })
        }
    }
})
