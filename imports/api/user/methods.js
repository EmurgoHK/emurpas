import { Meteor } from 'meteor/meteor'

if (Meteor.isDevelopment) {
    Meteor.methods({
        generateTestUser: () => {
            Accounts.createUser({
                password: '1234',
                email: 'derp@test.com'
            })
        },
        generateTestUserUI: () => {
            let user = Meteor.users.findOne({
                username: 'testing'
            })

            if (!user) {
                let uId = Accounts.createUser({
                    username: 'testing',
                    password: 'testing',
                    email: 'testing@testing.test',
                    profile: {
                        name: 'Tester'
                    }
                })
            }
        }
    })
}
