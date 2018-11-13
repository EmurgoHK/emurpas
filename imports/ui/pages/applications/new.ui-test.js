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

        browser.execute(() => {
            Meteor.call('generateTestModerator', (err, data) => {})
        })

        browser.pause(2000)
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
            // assert(browser.execute(() => $('.steps').find('li.active').text().trim()).value === `Step ${conv[ind]}`, true)

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

    it('userinfo should render correctly after application has been added', () => {
        browser.url(`${baseUrl}/userInfo`)
        browser.pause(10000)
        
        assert(browser.isExisting('#user-info-wizard'), true)
        assert(browser.isVisible('#user-info-wizard'), true)
    })

    it('userinfo should have 3 steps', () => {
        assert(browser.execute(() => $('.steps').find('li').length).value === 3, true)
    })

    it('userinfo shouldn\'t allow access to next step if data is missing', () => {
        browser.click('.wizard-next-button')

        browser.pause(3000)

        assert(browser.execute(() => $('.steps').find('li.active').text().trim()).value === 'Step One', true)
    })

    it('userinfo should allow insertion when inputs are valid', () => {
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

    it('user can comment', () => {
        browser.click('.comment-new')
        browser.pause(2000)

        browser.setValue('#comments-problem_description', 'Test comment')
        browser.pause(2000)

        browser.click('.new-comment')
        browser.pause(3000)

        assert(browser.execute(() => Array.from($('.comments').find('.card-body span')).some(i => $(i).text().includes('Test comment'))).value, true)
    })

    it('user can reply to a comment', () => {
        browser.click('.reply')
        browser.pause(2000)

        let comment = browser.execute(() => testingComments.findOne({}, {
            sort: {
                createdAt: -1
            }
        })).value

        browser.setValue(`.rep-comment-${comment._id}`, 'Test reply')
        browser.pause(1000)

        browser.click('.reply-comment')
        browser.pause(3000)

        assert(browser.execute(() => Array.from($('.comments').find('.card-body span')).some(i => $(i).text().includes('Test reply'))).value, true)
    })

    it('user can edit a comment', () => {
        browser.execute(() => $('.news-settings').find('.dropdown-menu').addClass('show'))
        browser.pause(3000)

        browser.click('.edit-mode')
        browser.pause(2000)

        let comment = browser.execute(() => testingComments.findOne({}, {
            sort: {
                createdAt: -1
            }
        })).value

        browser.setValue(`.edit-test`, 'Test comment 2')
        browser.pause(1000)

        browser.click('.edit-comment')
        browser.pause(3000)

        assert(browser.execute(() => Array.from($('.comments').find('.card-body span')).some(i => $(i).text().includes('Test comment 2'))).value, true)
    })

    it('user can remove a comment', () => {
        let count = browser.execute(() => $('.comments').find('.card').length).value

        browser.execute(() => $('.news-settings').find('.dropdown-menu').addClass('show'))
        browser.pause(3000)

        browser.click('.delete-comment')
        browser.pause(2000)

        browser.click('.swal2-confirm')
        browser.pause(2000)

        let countN = browser.execute(() => $('.comments').find('.card').length).value

        assert(count === countN + 1, true)
    })

    it ('moderator can delegate a question to another moderator', () => {
        browser.click('.js-delegate')
        browser.pause(2000)

        assert(browser.isExisting('.js-delegate-question'))
        assert(browser.isVisible('.js-delegate-question'))

        browser.click('.js-delegate-question')
        browser.pause(2000)

        assert(browser.isExisting('.js-revoke'))
        assert(browser.isVisible('.js-revoke'))
    })

    it ('moderator can revoke question delegation', () => {
        browser.click('.js-revoke')
        browser.pause(2000)

        assert(browser.isExisting('.js-delegate'))
        assert(browser.isVisible('.js-delegate'))
    })

    it ('moderator can vote on answers', () => {
        browser.click('#radio_problem_description_8')
        browser.pause(2000)

        browser.click('.js-rate-question')
        browser.pause(2000)

        assert(browser.isExisting('.fa-star'))
        assert(browser.isVisible('.fa-star'))

        assert(browser.execute(() => $('.text-warning strong').text().trim() === '8/10').value)
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

            Meteor.call('removeTestUserInfo', (err, data) => {})

            return 'ok'
        })

        browser.pause(5000)
    })
})