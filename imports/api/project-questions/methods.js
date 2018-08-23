import { ValidatedMethod } from 'meteor/mdg:validated-method'
import SimpleSchema from 'simpl-schema'

import { ProjectQuestions } from './project-questions'
import { updateFormProgress } from '../form-progress/methods'

SimpleSchema.extendOptions(['autoform'])

export const saveProjectQuestions = new ValidatedMethod({
    name: 'saveProjectQuestions',
    validate (_params) { },
    run({ projectID, data, steps }) {
        if (Meteor.isServer) {
            if (Meteor.userId()) {
                if (projectID === 'new') {
                    projectID = ProjectQuestions.insert(data, {validate: false})   
                } else {
                    ProjectQuestions.update({ '_id' : projectID }, { $set : data })
                }

                updateFormProgress('project', projectID, steps)
                return projectID
            }
        }
    }
})