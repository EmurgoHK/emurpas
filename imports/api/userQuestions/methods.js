import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { updateFormProgress } from '../form-progress/methods'

import { UserQuestions } from './userQuestions'

export const addUserInfo = new ValidatedMethod({
    name: 'addUserInfo',
    validate (_params) { },
    run({ userInfoID, userInfo, steps}) {
        if (Meteor.isServer && Meteor.userId()) {
            if (userInfoID === 'new') {
                userInfoID = UserQuestions.insert(userInfo, {validate: false})
            } else {
                UserQuestions.update({ '_id' : userInfoID }, { $set : userInfo })
            }

            updateFormProgress('user-info', userInfoID, steps)
            return userInfoID
        }
    }
})