import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema'

import { ProjectQuestions } from '/imports/api/project-questions/project-questions'

Accounts.onCreateUser((options, user) => {
	user.profile = options.profile || {}

  	let projects = _.flatten(ProjectQuestions.find({}).fetch().map(i => {
  		return (i.team_members || []).map(j => ({
  			name: j.name,
  			address: j.email,
  			applicationId: i._id
  		}))
  	}))

  	let project = projects.filter(i => i.address === ((user.emails || [])[0] || {}).address)

	if (project.length > 0) {
		user.profile.team = {
			member: true,
			name: project[0].name,
			applicationId: project[0].applicationId
		}
	}

	return user
})
