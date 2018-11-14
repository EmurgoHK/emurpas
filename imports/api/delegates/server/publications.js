import { Meteor } from 'meteor/meteor'

import { Delegates } from '../delegates'

Meteor.publish('delegates', () => {
	if (!Meteor.userId()) return;
	
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
