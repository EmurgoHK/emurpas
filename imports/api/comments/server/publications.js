import { Meteor } from 'meteor/meteor'

import { Comments } from '../comments'

Meteor.publish('comments.item', (resId) => {
	if (!Meteor.userId()) return;
	return Comments.find({
		$and: [{
			$or: [ // It must match the requested item
				{parentId: resId}, 
				{resourceId: resId}
			],
			$or: [ // Filter by isModeratorOnly
				{isModeratorOnly: !!Meteor.user().moderator}, // Moderator only if the user is a moderator
				{isModeratorOnly: false},	// Not moderator only comments can be viewed by anyone
				{isModeratorOnly: {$exists: false}}, // If it is not set explicitly we default to public comment
			],
		}
		]
	}, {
		sort: {
			createdAt: -1
		}
	})
})

Meteor.publish('comments', () => {
	return Comments.find({}, {
		sort: {
			createdAt: -1
		}
	})
})
