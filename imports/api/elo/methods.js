import { ValidatedMethod } from 'meteor/mdg:validated-method'
import SimpleSchema from 'simpl-schema'

import { ELO } from './elo'
import crypto from 'crypto'

import { ProjectQuestions } from '/imports/api/project-questions/project-questions'
import { QuestionRating } from '/imports/api/question-rating/question-rating'
import { EloRankings } from './eloRankings'

export const tabulateElo = new ValidatedMethod({
    name: 'tabulateElo',
    validate: null,
    run({}) {
        // Update the EloRankings db to make sure all currencies are included
        // each question for each currency needs an elo ranking - each question is a different game

        //Initiate elo ranking at 400
        let applications = ProjectQuestions.find({}).fetch()

        const excludedKeys = ['eloRanking', 'createdAt', 'createdBy', 'team_members', 'id']
        let questions = ProjectQuestions.schema.objectKeys().filter(i => !~excludedKeys.indexOf(i))

        applications.forEach(application => {
            questions.forEach(question => {
            // Create unique ID for each ELO ranking 'player'
            
            const qId = crypto.createHash('md5').update(question).digest('hex') // generate md5 of the question key, so it'll be a unique value
            const aId = application._id

            const id = `${qId.toString().substr(qId.length - 5)}${aId.toString().substr(aId.length - 5)}`
        
            try {
                EloRankings.insert({
                    _id: id,
                    applicationId: aId,
                    questionId: question,
                    ranking: 400
                })
            } catch(err) {}
            })
        })

        let ratings = QuestionRating.find({
            processed: false
        }).fetch()

        ratings.forEach(rating => {        
            const elo = new ELO()

            let loserRanking = false
            let winnerRanking = false
            
            if (rating.winner && rating.loser && rating.winner !== 'tie') {
                let qId = crypto.createHash('md5').update(rating.questionId).digest('hex') // create md5 value of questionId to ensure it's unique
                qId = qId.substr(qId.length - 5)

                let winnerEloId = `${qId}${rating.winner.toString().substr(rating.winner.length - 5)}`
                let loserEloId = `${qId}${rating.loser.toString().substr(rating.loser.length - 5)}`

                loserRanking = (EloRankings.findOne({
                    _id: loserEloId
                }) || {}).ranking

                winnerRanking = (EloRankings.findOne({
                    _id: winnerEloId
                }) || {}).ranking
            
                let result = elo.newRatingIfWon(winnerRanking, loserRanking)
            
                EloRankings.upsert({
                    _id: winnerEloId
                }, {
                    $set: {
                        ranking: result
                    }
                })
            }

            QuestionRating.upsert({
                _id: rating._id
            }, {
                $set: {
                    processed: true
                }
            })
        })
    }
})

export const averageElo = new ValidatedMethod({
    name: 'averageElo',
    validate: null,
    run({}) {        
        let applications = ProjectQuestions.find({}).fetch()

        applications.forEach(i => {
            let ratings = EloRankings.find({
                applicationId: i._id
            }).fetch()

            let ratingArray = []
            let final = 0

            ratings.forEach((j, ind) => {
                ratingArray.push(j.ranking)

                if (parseInt(ind) + 1 === ratings.length) {
                    let sum = _.reduce(ratingArray, (memo, num) => memo + num, 0)

                    final = Math.floor(sum / (ratings.length))
                    
                    // actually upsert fails, update doesn't
                }
            })

            // I don't think so, update required inside ratings loop.
            ProjectQuestions.update({
                _id: i._id
            }, {
                $set: {
                    eloRanking: final
                }
            })
        })
    }
})