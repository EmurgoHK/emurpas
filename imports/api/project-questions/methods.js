import { ValidatedMethod } from 'meteor/mdg:validated-method'
import SimpleSchema from 'simpl-schema'

import { ProjectQuestions } from './project-questions'
import { FormProgress } from '../form-progress/form-progress'

SimpleSchema.extendOptions(['autoform'])

export const saveProjectQuestions = new ValidatedMethod({
    name: 'saveProjectQuestions',
    validate (_params) { },
    run({ projectID, data, steps }) {
        if (Meteor.isServer) {
            if (Meteor.userId()) {
                if (projectID === 'new') {
                    // insert questions data and get id
                    projectID = ProjectQuestions.insert(data, {validate: false})   

                    // track progress for new data
                    FormProgress.insert({
                        user_id: Meteor.userId(),
                        form_type: 'project',
                        form_type_id: projectID,
                        last_step: steps.last,
                        next_step: steps.next,
                        created_at: new Date().getTime(),
                        updated_at: new Date().getTime()
                    })
                } else {
                    ProjectQuestions.update({ '_id' : projectID }, { $set : data })
                    FormProgress.update({ 'user_id' : Meteor.userId(), 'form_type_id' : projectID }, { $set : {
                        last_step: steps.current,
                        next_step: steps.next,
                        updated_at: new Date().getTime()
                    }})
                }

                return projectID
            }
        }
    }
})