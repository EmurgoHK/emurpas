const assert = require('assert')
const baseUrl = 'http://localhost:3000'

describe('New application', function () {
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
        browser.url(`${baseUrl}/applications`)
        browser.pause(5000)
        
        assert(browser.isExisting('#basic-wizard'), true)
        assert(browser.isVisible('#basic-wizard'), true)
    })

    it('it should have 4 steps', () => {
        assert(browser.execute(() => $('.steps').find('li').length).value === 4, true)
    })

    it('it shouldn\'t allow access to next step if data is missing', () => {
        browser.click('.wizard-next-button')

        browser.pause(3000)

        assert(browser.execute(() => $('.steps').find('li.active').text().trim()).value === 'Step One', true)
    })

    it('it should allow insertion when inputs are valid', () => {
        let steps = browser.execute(() => Blaze.getView($('.card').get(0))._templateInstance.wizard.steps.map(i => ({
            keys: i.schema._schemaKeys
        }))).value

        const conv = ['One', 'Two', 'Three', 'Four'] // funny, but it works

        steps.forEach((i, ind) => {
            assert(browser.execute(() => $('.steps').find('li.active').text().trim()).value === `Step ${conv[ind]}`, true)

            let keys = i.keys

            keys.forEach(j => {
                // special cases
                if (j === 'is_solvable_by_traditional_db') {
                    browser.execute(() => $($('input[name="is_solvable_by_traditional_db"]').get(2)).click()) // test out the 'possibly' option
                } else if (j === 'team_members') {
                    browser.execute(() => $('input[name="team_members.0.name"]').val('test'))
                    browser.pause(2000)
                    browser.execute(() => $('input[name="team_members.0.email"]').val('test@test.com'))
                    browser.pause(2000)
                    browser.execute(() => $('.autoform-add-item').click())
                } else {
                    browser.execute((j) => $(`.form-control[name="${j}"]`).val('test'), j)
                }

                browser.pause(2000)
            })

            browser.pause(5000)

            if (ind < 3) {
                browser.execute(() => $('.wizard-next-button').focus())
                browser.pause(2000)
                browser.click('.wizard-next-button')
            } else {
                browser.execute(() => $('.wizard-submit-button').focus())
                browser.pause(2000)
                browser.click('.wizard-submit-button')
            }

            browser.pause(3000)
        })

        browser.pause(3000)
        assert(browser.execute(() => FlowRouter.current().route.name === 'App.home').value, true)

        browser.click('.swal-button--confirm')
        browser.pause(3000)

        assert(browser.execute(() => FlowRouter.current().route.name === 'userInfo').value, true)
    })

    it ('should show up on the moderator panel', () => {
        browser.url(`${baseUrl}/moderator/applications`)
        browser.pause(6000)

        assert(browser.execute(() => $('.documents-index-item').length > 0), true)
    })

    it ('moderator can view more details', () => {
        browser.click('.btn-secondary')
        browser.pause(6000)

        assert(browser.execute(() => Number($('.card-body').text().trim().split(' ').pop()) > 0), true)
    })

    it ('moderator can remove an application', () => {
        browser.click('.js-remove')
        browser.pause(3000)

        browser.click('.swal-button--confirm')
        browser.pause(3000)

        assert(browser.execute(() => FlowRouter.current().route.name === 'modApplications'), true)
    })

    after(() => {
        browser.pause(3000)

        browser.execute(() => {
            Meteor.call('removeTestApplication', (err, data) => {})

            return 'ok'
        })

        browser.pause(5000)
    })
})