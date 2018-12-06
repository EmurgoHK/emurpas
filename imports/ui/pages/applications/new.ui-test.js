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
    browser.waitUntil(() => browser.getUrl() === baseUrl + url, 5000)
    browser.executeAsync(done => Tracker.afterFlush(done))
    browser.pause(500) // TODO: figure out a method to wait for event subscriptions/dataloading to finish
}

describe('New application', function () {
    before(() => {
        browser.url(`${baseUrl}/`)
        waitForPageLoad(browser, '/')

        callMethod(browser, 'generateTestUserUI');
        browser.executeAsync((done) => Meteor.loginWithPassword('testing', 'testing', done))
        callMethod(browser, 'generateTestModerators')
    })

    it('it should render correctly', () => {
        browser.url(`/applications`);
        waitForPageLoad(browser, '/applications');

        browser.waitForExist('#basic-wizard');
        browser.waitForVisible('#basic-wizard');
    })

    it('it should have 4 steps', () => {
        assert.equal(browser.element('.steps').elements('li').value.length, 4)
    })

    it('it shouldn\'t allow access to next step if data is missing', () => {
        browser.click('.wizard-next-button')

        browser.waitForExist('.form-group.has-error')
        browser.waitForText('.help-block');

        assert.equal(browser.getText('.steps li.active').trim(), 'Step One')
    })

    it('it should allow insertion when inputs are valid', () => {
        let steps = browser.execute(() => Wizard.get('basic-wizard').steps.map(i => ({
            keys: i.schema._schemaKeys
        }))).value

        steps.forEach((i, ind) => {
            let keys = i.keys

            keys.forEach(j => {
                // special cases
                if (j === 'is_solvable_by_traditional_db') {
                    browser.execute(() => $($('input[name="is_solvable_by_traditional_db"]').get(2)).click()) // test out the 'possibly' option
                } else if (j === 'team_members') {
                    browser.execute(() => $('input[name="team_members.0.name"]').val('test'))
                    browser.execute(() => $('input[name="team_members.0.email"]').val('test@test.com'))
                    browser.execute(() => $('.autoform-add-item').click())
                } else {
                    browser.execute((j) => $(`.form-control[name="${j}"]`).val('test'), j)
                }
            })

            if (ind < 3) {
                browser.execute(() => $('.wizard-next-button').focus())
                browser.click('.wizard-next-button')
            } else {
                browser.execute(() => $('.wizard-submit-button').focus())
                browser.click('.wizard-submit-button')
            }
        })

        waitForPageLoad(browser, '/');

        browser.waitForEnabled('.swal-button--confirm');
        browser.click('.swal-button--confirm');

        waitForPageLoad(browser, '/userInfo');
    })

    it('userinfo should render correctly after application has been added', () => {
        browser.url(`${baseUrl}/userInfo`)
        waitForPageLoad(browser, '/userInfo');
        
        assert.ok(browser.isExisting('#user-info-wizard'))
        assert.ok(browser.isVisible('#user-info-wizard'))
    })

    it('userinfo should have 3 steps', () => {
        assert(browser.execute(() => $('.steps').find('li').length).value === 3, true)
    })

    it('userinfo shouldn\'t allow access to next step if data is missing', () => {
        browser.click('.wizard-next-button')

        browser.waitForExist('.form-group.has-error')
        browser.waitForText('.help-block');

        assert.equal(browser.getText('.steps li.active').trim(), 'Step One')
    })

    it('userinfo should allow insertion when inputs are valid', () => {
        let steps = browser.execute(() => Wizard.get('user-info-wizard').steps.map(i => ({
            keys: i.schema._schemaKeys
        }))).value

        const conv = ['One', 'Two', 'Three'] // funny, but it works

        steps.forEach((i, ind) => {
            browser.waitUntil(() => browser.getText('.steps li.active').trim() === `Step ${conv[ind]}`);

            let keys = i.keys

            keys.forEach(j => {
                // special cases
                if (j === 'dob') {
                    browser.execute(() => $(`.form-control[name="dob"]`).val('1994-12-16'))
                } else if (j === 'country') {
                    //browser.execute(() => $(`.form-control[name="country"]`).val('Serb').keypress().focus())
                    browser.setValue(`.form-control[name="country"]`, 'Serb')
                    $('.tt-selectable').click()
                } else {
                    browser.execute((j) => $(`.form-control[name="${j}"]`).val('test'), j)
                }
            })
            if (ind < 2) {
                browser.execute(() => $('.wizard-next-button').focus());
                browser.click('.wizard-next-button');
            } else {
                browser.execute(() => $('.wizard-submit-button').focus());
                browser.click('.wizard-submit-button');
            }
        });
        waitForPageLoad(browser, '/');
    })

    it ('should show up on the moderator panel', () => {
        browser.executeAsync((done) => Meteor.loginWithPassword('mod', 'mod', done));
        callMethod(browser, 'generateTestApplication')

        browser.url(`${baseUrl}/moderator/applications`);
        waitForPageLoad(browser, '/moderator/applications');

        assert(browser.execute(() => $('.documents-index-item').length > 0), true)
    })

    it ('moderator can view more details', () => {
        browser.click('.btn-secondary')
        // waitForPageLoad(browser, '/moderator/application/*');

        assert(browser.execute(() => Number($('.card-body').text().trim().split(' ').pop()) > 0), true)
    })

    it ('moderator can delegate a question to another moderator', () => {
        browser.waitForExist('.js-delegate')
        browser.waitForVisible('.js-delegate')
        browser.click('.js-delegate')

        browser.waitForExist('.js-delegate-question')
        browser.waitForVisible('.js-delegate-question')

        browser.click('.js-delegate-question')

        browser.waitForExist('.js-revoke')
        browser.waitForVisible('.js-revoke')
    })

    it ('moderator can revoke question delegation', () => {
        browser.click('.js-revoke')

        browser.waitForExist('.js-delegate')
        browser.waitForVisible('.js-delegate')
    })

    it('moderator can vote', () => {
        assert(browser.isExisting('.js-vote'))
        assert(browser.isExisting('.js-vote'))

        browser.execute(() => $('.js-vote').click())
        
        browser.waitForVisible('.card-body .border-success')
    })

    it('user can comment', () => {
        browser.click('.comment-new')
        
        browser.waitForEnabled('.news-form textarea');
        browser.setValue('.news-form textarea', 'Test comment')

        browser.click('.new-comment')

        browser.waitUntil(() => browser.elements('.comments .card-body span').value.some(e => e.getText().trim() === 'Test comment'));
    })

    it('user can reply to a comment', () => {
        browser.click('.reply')

        let comment = browser.execute(() => testingComments.findOne({}, {
            sort: {
                createdAt: -1
            }
        })).value
        browser.waitForEnabled(`.rep-comment-${comment._id}`);
        browser.setValue(`.rep-comment-${comment._id}`, 'Test reply')

        browser.click('.reply-comment')

        browser.waitUntil(() => browser.elements('.comments .card-body span').value.some(e => e.getText().trim() === 'Test reply'));
    })

    it('user can edit a comment', () => {
        let comment = browser.execute(() => testingComments.findOne({}, {
            sort: {
                createdAt: -1
            }
        })).value
        browser.click(`#comment-${comment._id} .news-settings`);
        
        browser.waitForVisible(`#comment-${comment._id} .edit-mode`);
        browser.waitForEnabled(`#comment-${comment._id} .edit-mode`);
        browser.click(`#comment-${comment._id} .edit-mode`)

        browser.setValue(`.edit-test`, 'Test comment 2')

        browser.click('.edit-comment')

        browser.waitUntil(() => browser.getText(`#comment-${comment._id} .card-text`).trim() === 'Test comment 2')
    })

    it('user can remove a comment', () => {
        let comment = browser.execute(() => testingComments.findOne({}, {
            sort: {
                createdAt: -1
            }
        })).value;
        // browser.click(`#comment-${comment._id} .news-settings`);

        browser.waitForVisible(`#comment-${comment._id} .delete-comment`);
        browser.waitForEnabled(`#comment-${comment._id} .delete-comment`);
        browser.click(`#comment-${comment._id} .delete-comment`);

        browser.waitForEnabled('.swal2-confirm');
        browser.click('.swal2-confirm');

        browser.waitUntil(() => !browser.isExisting(`#comment-${comment._id}`));
    })

    after(() => {
        callMethod(browser, 'removeTestApplication')
        callMethod(browser, 'removeTestUserInfo');
    })
})