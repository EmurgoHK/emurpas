import { chai, assert } from 'chai'
import { Meteor } from 'meteor/meteor'

import { ProjectQuestions } from './project-questions'
import { callWithPromise } from '/imports/api/utilities'

import './methods'

Meteor.userId = () => 'test-user' // override the meteor userId, so we can test methods that require a user
Meteor.users.findOne = () => ({ profile: { name: 'Test User'} }) // stub user data as well
Meteor.user = () => ({ profile: { name: 'Test User'} })

describe('project questions methods', () => {
    it('can submit new data', () => {
        const data = {
            problem_description: 'Test description',
            possible_solution: 'Test solution',
            proposed_solution: 'Test solution 2',
            attempted_solution: 'Test solution 3',
            is_solvable_by_traditional_db: true,
            blockchain_use_reason: 'Test reason',
            blockchain_requirement_reason: 'Test reason 2',
            blockchain_solution_proposal: 'Test proposal',
            ada_blockchain_aspects: 'Test ada',
            target_market_size: 'Test market size',
            target_market_regions: 'Test market regions',
            competitors: 'Test competitors',
            target_audience: 'Test audience',
            prototype: 'Test prototype',
            source_code_url: 'Test source code URL',
            development_roadmap: 'Test roadmap',
            project_website: 'Test website',
            business_plan: 'Test business plan',
            disruptive_solution_reason: 'Test reason 5',
            user_onboarding_process: 'User onboarding test',
            project_token_type: 'Test token type',
            unfair_advantage_reason: 'Test reason 6',
            team_members: [{
                name: 'Test user 1',
                email: 'test@test.com'
            }, {
                name: 'Test user 2',
                email: 'test2@test.com'
            }]
        }

        return callWithPromise('addProjectQuestions', data).then(infoId => {
            let info = ProjectQuestions.findOne({
                _id: infoId
            })

            Object.keys(data).forEach(i => {
                if (i === 'team_members') {
                    data[i].forEach((j, ind) => Object.keys(j).forEach(k => assert.ok(info[i][ind][k] === j[k])))
                } else {
                    assert.ok(info[i] === data[i])
                }
            })
        })
    })

    after(() => {
        ProjectQuestions.remove({})
    })
})
