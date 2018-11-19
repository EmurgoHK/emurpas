import { chai, assert } from 'chai'
import { Meteor } from 'meteor/meteor'

import { EloRankings } from './eloRankings'
import { ProjectQuestions } from '/imports/api/project-questions/project-questions'
import { QuestionRating } from '/imports/api/question-rating/question-rating'
import { callWithPromise } from '/imports/api/utilities'

import './methods'
import '/imports/api/question-rating/methods'

import crypto from 'crypto'

Meteor.userId = () => 'test-user' // override the meteor userId, so we can test methods that require a user
Meteor.users.findOne = () => ({ _id: 'test-user', profile: { name: 'Test User'}, moderator: true }) // stub user data as well
Meteor.user = () => ({ _id: 'test-user', profile: { name: 'Test User'}, moderator: true })

describe('elo methods', () => {
    it('tabulateElo work correctly', () => {
        // create a new application
        const info = {
            problem_description: 'Test description',
            possible_solution: 'Test solution',
            proposed_solution: 'Test solution 2',
            attempted_solution: 'Test solution 3',
            is_solvable_by_traditional_db: 'Yes',
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
            }],
            id: 1,
            eloRanking: 400,
            applicationWeight: '2'
        }

        for (let i = 0; i < 2; i++) {
            let pq = ProjectQuestions.insert(info)

            assert.ok(pq)
        }

        let pq = ProjectQuestions.find({}).fetch()

        const excludedKeys = ['eloRanking', 'createdAt', 'createdBy', 'team_members', 'id']
        let questions = ProjectQuestions.schema.objectKeys().filter(i => !~excludedKeys.indexOf(i))

        return callWithPromise('tabulateElo', {}).then(data => {
            let rankings = EloRankings.find({}).fetch()

            assert.equal(rankings.length, pq.length * questions.length) // check if the ranking database is initialized correctly
                
            for (let i = 0; i < rankings.length; i++) {
                assert.equal(rankings[i].ranking, 400)
                assert.ok(crypto.createHash('md5').update(rankings[i].questionId).digest('hex').endsWith(rankings[i]._id.slice(0, 5)))
                assert.ok(rankings[i].applicationId.endsWith(rankings[i]._id.slice(5, 10)))
            }

            return callWithPromise('rateQuestion', {
                questionId: 'problem_description',
                applications: pq.map(i => i._id).slice(0, 2),
                winner: pq[0]._id
            }).then(data => {
                return callWithPromise('tabulateElo', {}).then(data => {
                    let winnerRanking = EloRankings.findOne({
                        applicationId: pq[0]._id,
                        questionId: 'problem_description'
                    })

                    let loserRanking = EloRankings.findOne({
                        applicationId: pq[1]._id,
                        questionId: 'problem_description'
                    })

                    assert.ok(winnerRanking.ranking > 400)
                    assert.ok(loserRanking.ranking <= 400)
                })
            })
        })
    })

    it('averageElo is working correctly', () => {
        return callWithPromise('averageElo', {}).then(data => {
            let applications = ProjectQuestions.find({}).fetch()

            for (let i = 0; i < applications.length; i++) {
                const excludedKeys = ['eloRanking', 'createdAt', 'createdBy', 'team_members', 'id']
                let questions = ProjectQuestions.schema.objectKeys().filter(i => !~excludedKeys.indexOf(i))

                let diffRating = EloRankings.findOne({
                    applicationId: applications[i]._id,
                    questionId: 'problem_description'
                })

                assert.equal(applications[i].eloRanking, Math.floor((diffRating.ranking + (questions.length - 1) * 400) / questions.length))
            }
        })
    })

    after(function() {
        EloRankings.remove({})
        ProjectQuestions.remove({})
        QuestionRating.remove({})
    })
})
