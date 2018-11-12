import { Meteor } from 'meteor/meteor'

import { ValidatedMethod } from 'meteor/mdg:validated-method'
import SimpleSchema from 'simpl-schema'

export const isModerator = userId => {
	let user = Meteor.users.findOne({
        _id: userId
    })

    return user && user.moderator
}

export const updateUserStatus = new ValidatedMethod({
	name: 'updateUserStatus',
	validate: new SimpleSchema({
		userId: {
			type: String,
			optional: false
		},
		moderator: {
			type: Boolean,
			optional: false
		}
	}).validator({
    	clean: true,
    	filter: false
    }),
    run({ userId, moderator }) {
    	if (Meteor.userId() && isModerator(Meteor.userId())) {
    		if (Meteor.userId() === userId) {
    			throw new Meteor.Error('Error', 'You can\'t demote yourself.')
    		}

    		Meteor.users.update({
    			_id: userId
    		}, {
    			$set: {
    				moderator: moderator
    			}
    		})
    	} else {
    		throw new Meteor.Error('Error', 'Insufficient permissions.')
    	}
    }
})

if (Meteor.isDevelopment) {
    Meteor.methods({
        generateTestUser: () => {
            Accounts.createUser({
                password: '1234',
                email: 'derp@test.com'
            })
        },
        generateTestUserUI: () => {
            let user = Meteor.users.findOne({
                username: 'testing'
            })

            if (!user) {
                let uId = Accounts.createUser({
                    username: 'testing',
                    password: 'testing',
                    email: 'testing@testing.test',
                    profile: {
                        name: 'Tester'
                    }
                })

                Meteor.users.update({
                    _id: uId
                }, {
                    $set: {
                        moderator: true
                    }
                })
            }
        },
        generateTestModerator: () => {
            let user = Meteor.users.findOne({
                username: 'mod'
            })

            if (!user) {
                let uId = Accounts.createUser({
                    username: 'mod',
                    password: 'mod',
                    email: 'mod@mod.test',
                    profile: {
                        name: 'Moderator'
                    }
                })

                Meteor.users.update({
                    _id: uId
                }, {
                    $set: {
                        moderator: true
                    }
                })
            }
        }
    })
}
