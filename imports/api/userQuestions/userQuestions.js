import { Mongo } from 'meteor/mongo'
import { Tracker } from 'meteor/tracker'

import SimpleSchema from 'simpl-schema'

SimpleSchema.extendOptions(['autoform'])

const UserQuestions = new Mongo.Collection('userQuestions')

if (Meteor.isServer) {

    Meteor.publish('userQuestions', function () {
        return UserQuestions.find({});
    });

    Meteor.publish('userQuestions', function (userInfoID) {
        return UserQuestions.find({ '_id' : userInfoID });
    });

    Meteor.publish('userInfo', () => UserQuestions.find({
        createdBy: Meteor.userId()
    }))
}

UserQuestions.schema = new SimpleSchema({
    fullName: {
        type:  String,
        label: 'What is your full name?'
    },
    dob: {
        type:  Date,
        label: 'What is your date of birth?'
    },
    country: {
        type:  String,
        // to use typeahead in autoform, just use the 'typeahead' type
        // options contains the dataset object
        autoform: {
            type: 'typeahead',
            options: require('country-list')().getCodeList()
        },
        label: 'What is your country of residence?'
    },
    github: {
        type:  String,
        optional: true,
        label: 'Please enter your GitHub username?'
    },
    reason: {
        type: String,
        label: 'Why do you want to work on this project?'
    },
    teamDescription: {
        type:  String,
        max: 600,
        autoform: {
            rows: 5
        },
        label: 'Describe the other people on your team and why you want to work with them.'
    },
    averageTeamWorkday: {
        type:  String,
        max: 300,
        autoform: {
            rows: 3
        },
        label: 'Describe an average workday with your team.'
    },
    timeCommitment: {
        type:  String,
        max: 300,
        autoform: {
            rows: 3
        },
        label: 'Describe your current time commitment to the project.'
    },
    personalInvestment: {
        type:  String,
        max: 300,
        autoform: {
            rows: 3
        },
        label: 'How much have you personally invested into the project thus far?'
    },
    relatedPastProjects: {
        type:  String,
        max: 300,
        autoform: {
            rows: 3
        },
        label: 'What other past projects have you worked on related to the one now?'
    },
    projectGoals: {
        type:  String,
        max: 600,
        autoform: {
            rows: 5
        },
        label: 'Describe your goals for the project 1 year, 2 years, 3 years on.'
    },
    likedBlockchainProjects: {
        type:  String,
        max: 300,
        autoform: {
            rows: 3
        },
        label: 'What are some blockchain projects that you like? Why?'
    },
    employmentStatus: {
        type:  String,
        max: 600,
        autoform: {
            rows: 5
        },
        label: 'Describe your current employment status.'
    },
    createdBy: {
        type: String,
        label: 'Author',
        autoValue: function() {
            if (!this.isSet) return

            return this.userId || 'Test author'
        },
        autoform: {
            type: 'hidden'
        }
    },
    createdAt: {
        type: Number,
        label: 'Created At',
        autoValue: function() {
            if (!this.isSet) return

            return new Date().getTime()
        },
        autoform: {
            type: 'hidden'
        }
    },
    updatedAt: {
        type: Number,
        label: 'Updated At',
        autoValue: function() {
            if (!this.isSet) return

            new Date().getTime()
        },
        autoform: {
            type: 'hidden'
        }
    }
}, {
    tracker: Tracker
})

UserQuestions.attachSchema(UserQuestions.schema)

export { UserQuestions }