import { Template } from "meteor/templating"

Template.registerHelper('SubsCacheReady', () => Object.keys(SubsCache.cache).map(x => SubsCache.cache[x].ready()).reduce((x1, x2) => x1 && x2, true))

Template.registerHelper('isTeamMember', () => (((Meteor.users.findOne({
	_id: Meteor.userId()
}) || {}).profile || {}).team || {}).member)