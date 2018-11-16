import { ValidatedMethod } from 'meteor/mdg:validated-method'
import SimpleSchema from 'simpl-schema'

import { QuestionRating } from './question-rating'
import { Delegates } from '/imports/api/delegates/delegates'

import crypto from 'crypto'

export const rateQuestion = new ValidatedMethod({
	name: 'rateQuestion',
	validate: new SimpleSchema({
        questionId: {
			type: String,
			optional: false
        },
        applications: {
            type: Array,
            optional: false
        },
        'applications.$': {
            type: String
        },
        winner: {
            type: String,
            optional: false
        }
	}).validator({
    	clean: true,
    	filter: false
    }),
    run({ questionId, applications, winner }) {
        if (Meteor.isServer){
            let delegates = Delegates.find({
                delegateTo: Meteor.userId(),
                questionId: questionId
            }).fetch().filter(i => ~i.scope.indexOf(applications[0]) || ~i.scope.indexOf(applications[1]) || ~i.scope.indexOf('all')).filter(i => !~(i.except || []).indexOf(applications[0]) && !~(i.except || []).indexOf(applications[1])).map(i => ({
                _id: i.createdBy
            }))

            delegates.push({
                _id: Meteor.userId()
            })
            
            delegates.forEach(i => {
                if (winner === 'tie') {
                    loser = 'lie'
                }

                let loser = applications[0]

                if (winner === loser) {
                    loser = applications[1]
                }

                const userInt = parseInt(`0x${crypto.createHash('md5').update(i._id).digest('hex').slice(0, 10)}`, 16)
                const dec_i = parseInt(`0x${crypto.createHash('md5').update(applications[0]).digest('hex').slice(0, 10)}`, 16)
                const dec_j = parseInt(`0x${crypto.createHash('md5').update(applications[1]).digest('hex').slice(0, 10)}`, 16)

                const ratingId = ((dec_i + dec_j + userInt) + parseInt(`0x${crypto.createHash('md5').update(questionId).digest('hex').slice(0, 10)}`, 16)).toString()

                return QuestionRating.upsert({
                    _id: ratingId
                }, {
                    $set: {
                        processed: false,
                        winner: winner,
                        loser: loser,
                        applications: applications,
                        answeredAt: new Date().getTime(),
                        questionId: questionId,
                        owner: i._id
                    }
                })
            })
        }
    }
})