const assert = require('assert')
const baseUrl = 'http://localhost:3000'

describe('User info', function () {
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
        browser.url(`${baseUrl}/userInfo`)
        browser.pause(10000)
        
        assert(browser.isExisting('#user-info-wizard'), true)
        assert(browser.isVisible('#user-info-wizard'), true)
    })

    it('it should have 3 steps', () => {
        assert(browser.execute(() => $('.steps').find('li').length).value === 3, true)
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

        const conv = ['One', 'Two', 'Three'] // funny, but it works

        steps.forEach((i, ind) => {
            assert(browser.execute(() => $('.steps').find('li.active').text().trim()).value === `Step ${conv[ind]}`, true)

            let keys = i.keys

            keys.forEach(j => {
                // special cases
                if (j === 'dob') {
                    browser.execute(() => $(`.form-control[name="dob"]`).val('1994-12-16'))
                } else if (j === 'country') {
                    //browser.execute(() => $(`.form-control[name="country"]`).val('Serb').keypress().focus())
                    browser.setValue(`.form-control[name="country"]`, 'Serb')
                    browser.pause(2000)
                    $('.tt-selectable').click()
                } else {
                    browser.execute((j) => $(`.form-control[name="${j}"]`).val('test'), j)
                }

                browser.pause(2000)
            })

            browser.pause(5000)

            if (ind < 2) {
                browser.execute(() => $('.wizard-next-button').focus())
                browser.pause(2000)
                browser.click('.wizard-next-button')
            } else {
                browser.execute(() => $('.wizard-submit-button').focus())
                browser.pause(2000)
                browser.click('.wizard-submit-button')
            }

            browser.pause(5000)
        })

        browser.pause(2000)
        assert(browser.execute(() => FlowRouter.current().route.name === 'App.home').value, true)
    })

    after(() => {
        browser.pause(3000)

        browser.execute(() => {
            Meteor.call('removeTestUserInfo', (err, data) => {})

            return 'ok'
        })

        browser.pause(5000)
    })
})