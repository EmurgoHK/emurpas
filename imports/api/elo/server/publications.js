import { Meteor } from 'meteor/meteor'

import { EloRankings } from '../eloRankings'

Meteor.publish('elo', (apps) => { // publish all elo rankings tfor given apps
	return EloRankings.find({
		applicationId: {
			$in: apps
		}
	}, {
		sort: {
			createdAt: -1
		}
	})
})
