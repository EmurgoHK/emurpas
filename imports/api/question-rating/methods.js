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

                
                let ratingCount = questionRating.ratingCount

                // calculate new average rating by summing all
                // existing ratings + new rating and divide by new ratingCount
                let avgRating = rating

                let previosRating = questionRating.ratings.filter(function(r) { return r.userId === Meteor.userId()});
                // check if user has already voted
                // EDIT mode
                if (previosRating && previosRating.length > 0) {
                    
                    // remove previous rating from the set
                    QuestionRating.update({
                        _id: questionRating._id
                    }, {
                        $pull: {
                            ratings: {
                                userId: Meteor.userId()
                            }
                        }
                    })

                    // calculate new average rating by summing all
                    // existing ratings + new rating - old rating and divide by old ratingCount
                    avgRating = ((questionRating.ratings.reduce((acc, curr) => {
                        return acc + curr.rating
                    }, 0)) + avgRating - previosRating[0].rating)/ratingCount

                } else {

                    // If the user is rating the question for the first time we need to increment the rating count & calculate the average
                    ratingCount += 1

                    // calculate new average rating by summing all
                    // existing ratings + new rating and divide by new ratingCount
                    avgRating = ((questionRating.ratings.reduce((acc, curr) => {
                        return acc + curr.rating
                    }, 0)) + avgRating)/ratingCount
                }


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