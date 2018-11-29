import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { updateFormProgress } from '../form-progress/methods'

import { UserQuestions } from './userQuestions'
import { FormProgress } from '../form-progress/form-progress'

export const addUserInfo = new ValidatedMethod({
    name: 'addUserInfo',
    validate (_params) { },
    run({ userInfoID, userInfo, steps}) {
        if (Meteor.isServer && Meteor.userId()) {
            if (userInfoID === 'new') {
                userInfo.createdBy = Meteor.userId();
                userInfoID = UserQuestions.insert(userInfo, {validate: false})
            } else {
                UserQuestions.update({ '_id' : userInfoID }, { $set : _.extend(userInfo, { updatedAt: new Date().getTime() }) })
            }

            updateFormProgress('user-info', userInfoID, '', steps)
            return userInfoID
        }
    }
})

export const updateUserInfo = new ValidatedMethod({
	name: 'updateUserInfo',
	validate: null,
	run({ _id, modifier }) {
		let uq = UserQuestions.findOne({
			_id: _id
		})

		if (uq.createdBy === Meteor.userId()) {
			return UserQuestions.update({
				_id: _id
			}, {
				$set: _.extend(_.omit(modifier['$set'], ['createdAt, createdBy']), {
					updatedAt: new Date().getTime(),
					createdBy: uq.createdBy,
					createdAt: uq.createdAt
				}) // prevent data overwriting
			})
		} else {
			throw new Meteor.Error('Error.', 'You can\'t edit user info that you haven\'t created.')
		}
	}
})

if (Meteor.isDevelopment) {
    Meteor.methods({
        removeTestUserInfo: () => {
            let uq = UserQuestions.findOne({
                fullName: 'test'
            })

            if (uq) {
            	UserQuestions.remove({
            		_id: uq._id
            	})

            	FormProgress.remove({
            		form_type_id: uq._id
            	})
			}
        }
    })
}
