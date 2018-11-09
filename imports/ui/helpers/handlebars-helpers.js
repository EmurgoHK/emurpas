import { Template } from "meteor/templating"

import { isModerator } from '/imports/api/user/methods'

import { UserQuestions } from '/imports/api/userQuestions/userQuestions'

import moment from 'moment'
import marked from 'marked'

Template.registerHelper('SubsCacheReady', () => Object.keys(SubsCache.cache).map(x => SubsCache.cache[x].ready()).reduce((x1, x2) => x1 && x2, true))

Template.registerHelper('isTeamMember', (menu) => {
	if (!menu) {
		Meteor.subscribe('userInfo')

		let user = UserQuestions.findOne({
			createdBy: Meteor.userId()
		})

		if (user) {
			return false
		}
	}

	return (((Meteor.users.findOne({
		_id: Meteor.userId()
	}) || {}).profile || {}).team || {}).member
})

Template.registerHelper('md', content => {
    return  this.innerHTML = marked(content || '')
})

Template.registerHelper('isModerator', () => isModerator(Meteor.userId()))

Template.registerHelper('objToArray',function(obj, toSkip){
	var result = [];
	toSkip = toSkip.split(',')

	for (var key in obj) 
		if (!toSkip.includes(key))
			result.push({field: key.replace(/_/gi, ' '), value: obj[key]});

    return result;
});

Template.registerHelper('showTimeAgoTimestamp', (date, timezone) => {
	if (!date) {
		return ''
	}

	return moment(date).fromNow()
})

