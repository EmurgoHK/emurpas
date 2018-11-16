import { Meteor } from 'meteor/meteor'

import { tabulateElo, averageElo } from '/imports/api/elo/methods'

Meteor.startup(() => {
	SyncedCron.add({
	  	name: 'Tabulate ELO values',
	  	schedule: (parser) => parser.text('every 10 minutes'),
	  	job: () => tabulateElo.call({}, (err, data) => {})
	})

	SyncedCron.add({
	    name: 'Average ELO rankings',
	    schedule: parser => parser.text('every 10 minutes'),
	    job: () => averageElo.call({}, (err, data) => {})
	})
})