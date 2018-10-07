import { Meteor } from 'meteor/meteor'
import { QuestionRating } from '../question-rating'

Meteor.publish('questionRating.all', () => QuestionRating.find({}))
