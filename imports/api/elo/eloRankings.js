import { Mongo } from 'meteor/mongo'
import SimpleSchema from 'simpl-schema'

export const EloRankings = new Mongo.Collection('eloRankings')

EloRankings.schema = new SimpleSchema({
  	_id: {
  		type: String,
  		optional: false
  	}, 
  	applicationId: {
  		type: String,
  		optional: false
  	},
  	questionId: {
  		type: String,
  		optional: false
  	}, 
  	ranking: {
  		type: Number,
  		optional: false
  	}
})

EloRankings.deny({
  	insert: () => true,
  	update: () => true,
  	remove: () => true,
})
