import { Meteor } from 'meteor/meteor'

import { Delegates } from '../delegates'

Meteor.publish('delegates', () => {
	return Delegates.find({
		$or: [{
			createdBy: Meteor.userId()
		}, {
			delegateTo: Meteor.userId()
		}]
	}, {
		sort: {
			createdAt: -1
		}
	})
})
