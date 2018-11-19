import { Meteor } from 'meteor/meteor'

import { Contact } from '../contact'

import { isModerator } from '/imports/api/user/methods'

Meteor.publish('contact', () => {
	if (!Meteor.userId()) return

	if (isModerator(Meteor.userId())) {
		return Contact.find({}, {
			sort: {
				createdAt: -1
			}
		})
	} 
	
	return Contact.find({
		createdBy: Meteor.userId()
	}, {
		sort: {
			createdAt: -1
		}
	})
})
