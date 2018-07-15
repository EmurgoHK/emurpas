import { ValidatedMethod } from 'meteor/mdg:validated-method'
import SimpleSchema from 'simpl-schema'

import { UserQuestions } from './userQuestions'

export const addUserInfo = new ValidatedMethod({
    name: 'addUserInfo',
    validate: UserQuestions.schema.validator({
    	clean: true,
    	filter: false
    }),
    run(userInfo) {
        return UserQuestions.insert(userInfo)
    }
})