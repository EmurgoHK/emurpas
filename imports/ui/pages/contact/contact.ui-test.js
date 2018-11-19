const assert = require('assert')
const baseUrl = 'http://localhost:3000'

const callMethod = (browser, methodName, ...args) => {
    const result = browser.executeAsync(
        (methodName, ...args) => {
        const done = args.pop()
        Meteor.call(methodName, ...args, (err, res) => done({ err, res }))
        },
        methodName,
        ...args
    )

    if (result.value.err) throw result.err

    return result.value.res
}

const waitForPageLoad = (browser, url) => {
    browser.waitUntil(() => browser.getUrl() === baseUrl + url)
    browser.executeAsync(done => Tracker.afterFlush(done))
    browser.pause(500) // TODO: figure out a method to wait for event subscriptions/dataloading to finish
}
  
describe('Contact', function () {
    before(() => {
        browser.url(`${baseUrl}/`)
        waitForPageLoad(browser, '/')

        callMethod(browser, 'generateTestUserUI');
        browser.executeAsync((done) => Meteor.loginWithPassword('testing', 'testing', done))
    })

    it('it should render correctly', () => {
        browser.url(`/contact`)
        waitForPageLoad(browser, '/contact')

        browser.waitForExist('.card')
        browser.waitForVisible('.card')
    })

    it('user can add a new question', () => {
        browser.url('/contact/new')
        waitForPageLoad(browser, '/contact/new')

        browser.waitForExist('#title')
        browser.waitForExist('#body')

        browser.setValue('#title', 'Test title')

        browser.click('.new-contact')

        browser.waitForVisible('#bodyError')
        browser.waitForText('#bodyError')

        browser.setValue('#body', 'Test body')

        browser.click('.new-contact')

        waitForPageLoad(browser, '/contact')
    })

    it('user can see question info', () => {
        browser.click('.btn-primary')

        // waitForPageLoad(browser, '/contact/view/*')
        browser.pause(2000)

        assert.equal(browser.getText('.card-header').trim(), 'open Test title')

        assert.equal(browser.getText('.card-text').trim(), 'Test body')
    })

    it('user can change question status', () => {
        browser.click('.change-status')
        browser.waitUntil(() => browser.getText('.badge')[1] === 'resolved', 5000)

        browser.click('.change-status')
        browser.waitUntil(() => browser.getText('.badge')[1] === 'open', 5000)
    })

    it('user can remove a question', () => {
        browser.url('/contact')
        waitForPageLoad(browser, '/contact')

        browser.click('.remove')
        browser.waitForExist('table', 2000, true)
    })
})