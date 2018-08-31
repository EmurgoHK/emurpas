const assert = require('assert')
const baseUrl = 'http://localhost:3000'

describe('Moderator users', function () {
    before(() => {
        browser.url(`${baseUrl}/`)
        browser.pause(5000)

        browser.execute(() => {
            Meteor.call('generateTestUserUI', (err, data) => {})

            return 'ok'
        })

        browser.pause(5000)

        browser.execute(() => Meteor.loginWithPassword('testing', 'testing'))

        browser.pause(10000)
    })

    it('it should render correctly', () => {
        browser.url(`${baseUrl}/moderator/applications`)
        browser.pause(5000)
        
        assert(browser.isExisting('.card'), true)
        assert(browser.isVisible('.card'), true)
    })

    it('it should show correct buttons', () => {
        assert(browser.execute(() => $('.js-promote').length || $('.js-demote').length), true)
    })
})