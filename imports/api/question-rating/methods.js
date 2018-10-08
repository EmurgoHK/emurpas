import { ValidatedMethod } from 'meteor/mdg:validated-method'
import SimpleSchema from 'simpl-schema'

import { QuestionRating } from './question-rating'

export const rateQuestion = new ValidatedMethod({
	name: 'rateQuestion',
	validate: new SimpleSchema({
		applicationId: {
			type: String,
			optional: false
        },
        questionCode: {
			type: String,
			optional: false
        },
        rating: {
            type: Number,
            optional: false
        }
	}).validator({
    	clean: true,
    	filter: false
    }),
    run({ applicationId, questionCode, rating}) {
        if (Meteor.isServer){
            let questionRating = QuestionRating.findOne({
                applicationId: applicationId, 
                questionCode: questionCode
            })

            if (questionRating && questionRating !== undefined) {
                // check if user has already voted, throw if true
                if (questionRating.ratings.some(r => r.userId === Meteor.userId())) {
                    throw new Meteor.Error('Error', 'You already rated this response.')
                }

                // calculate average rating and rating count
                // add one for the newly added rating
                let ratingCount = questionRating.ratingCount + 1 

                // calculate new average rating by summing all
                // existing ratings + new rating and divide by new ratingCount
                let avgRating = ((questionRating.ratings.reduce((acc, curr) => {
                    return acc + curr.rating
                }, 0)) + rating)/ratingCount

                // Add new question rating to set and
                // update  averageRating and ratingCount
                QuestionRating.update({
                    _id: questionRating._id
                }, {
                    $set: {
                        averageRating: avgRating,
                        ratingCount: ratingCount,
                        updatedAt: new Date().getTime()
                    },
                    $addToSet: {
                        ratings: {
                            userId: Meteor.userId(),
                            rating: rating,
                            votedOn: new Date().getTime()
                        }
                    }
                })

                // return question rating Id
                return questionRating._id
            }

            // Go ahead and insert an initial record of the question rating
            return QuestionRating.insert({
                applicationId: applicationId,
                questionCode: questionCode,
                averageRating: rating,
                ratingCount: 1,
                ratings: [{
                    userId: Meteor.userId(),
                    rating: rating,
                    votedOn: new Date().getTime(),
                }],
                createdAt: new Date().getTime()
            })
        }
    }
})