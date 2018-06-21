import { Meteor } from 'meteor/meteor'

if (Meteor.isDevelopment) {
    Meteor.methods({
        generateTestUser: () => {
            Accounts.createUser({
                password: '1234',
                email: 'derp@test.com'
            })
        }
    })
}
