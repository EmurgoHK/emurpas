import { Meteor } from 'meteor/meteor'

import { Comments } from '../comments'

Meteor.publish('comments.item', (resId) => {
	return Comments.find({
		$or: [{
			parentId: resId
		}, {
			resourceId: resId
		}]
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
